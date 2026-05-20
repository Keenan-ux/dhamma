"""GPU-accelerated BGE-M3 embedding for dictionary_entries.

Modelled on ingest_cst.py but UPDATE-only (dictionary rows already
exist; we just fill the `embedding` column). Same FP16 ONNX + CUDA EP
pipeline, ~5x faster than int8 on this GPU.

Vectors live in the same 1024-dim cosine space as passages.embedding
(BGE-M3 mean-pooled + L2-normalized), so the JS-side embedQuery in
server/src/embed.js can match these at runtime — ~0.98 cosine drift
between int8 (JS) and fp16 (Python) is within ANN tolerance.

Run from C:\\Dev\\Dhamma\\scripts\\ingest:
    $env:DATABASE_URL = "postgres://...@localhost:15432/dhamma"
    .venv/Scripts/python.exe embed_dict.py
    .venv/Scripts/python.exe embed_dict.py --limit=500   # smoke
    .venv/Scripts/python.exe embed_dict.py --batch=8     # override
"""

import os, sys, glob, time, re, argparse
# Load NVIDIA CUDA DLLs from the venv-bundled nvidia-* wheels BEFORE
# importing onnxruntime — required on Windows for CUDA EP to bind.
_VENV = os.path.dirname(os.path.dirname(sys.executable))
for _bin in glob.glob(os.path.join(_VENV, "Lib", "site-packages", "nvidia", "*", "bin")):
    os.add_dll_directory(_bin)

import numpy as np
import psycopg2
import psycopg2.extras
import onnxruntime as ort
from transformers import AutoTokenizer
from huggingface_hub import hf_hub_download

# ─────────────────────────────── config ───────────────────────────────

MODEL_REPO = "Xenova/bge-m3"
MODEL_FILE = "onnx/model_fp16.onnx"
MAX_CHARS  = 1200          # matches embed-dict.mjs — long DPPN bios get truncated
MAX_TOKENS = 8192
EMBED_DIM  = 1024

# ─────────────────────────────── args ─────────────────────────────────

ap = argparse.ArgumentParser()
ap.add_argument("--limit", type=int, default=None,
                help="Only embed first N rows (smoke test)")
ap.add_argument("--batch", type=int, default=16,
                help="Embedding batch size (16 is comfortable on 4GB VRAM at MAX_CHARS=1200)")
ap.add_argument("--fetch", type=int, default=512,
                help="Rows to fetch per DB round-trip")
ap.add_argument("--log-every", type=int, default=500,
                help="Print progress every N rows")
ap.add_argument("--no-hnsw", action="store_true",
                help="Skip HNSW index creation at the end")
args = ap.parse_args()

if not os.environ.get("DATABASE_URL"):
    print("DATABASE_URL not set", file=sys.stderr); sys.exit(1)

# ─────────────────────────────── model ────────────────────────────────

print(f"[model] downloading/locating {MODEL_REPO}/{MODEL_FILE}…")
onnx_path = hf_hub_download(MODEL_REPO, MODEL_FILE)
print(f"[model] {onnx_path}")

print(f"[model] creating CUDA InferenceSession…")
sess = ort.InferenceSession(
    onnx_path,
    providers=["CUDAExecutionProvider", "CPUExecutionProvider"],
)
if "CUDAExecutionProvider" not in sess.get_providers():
    print("FATAL: CUDA EP not active — providers:", sess.get_providers(), file=sys.stderr)
    sys.exit(1)
print(f"[model] providers active: {sess.get_providers()}")

tokenizer = AutoTokenizer.from_pretrained(MODEL_REPO)

# ─────────────────────────────── DB ───────────────────────────────────

conn = psycopg2.connect(os.environ["DATABASE_URL"])
conn.autocommit = False
cur = conn.cursor()
print("[db] connected.")

cur.execute("SELECT COUNT(*) FROM dictionary_entries")
total = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM dictionary_entries WHERE embedding IS NULL")
pending = cur.fetchone()[0]
print(f"[resume] {total} rows total, {pending} pending, {total - pending} already embedded")

if pending == 0:
    print("[done] nothing to embed.")
    if not args.no_hnsw:
        print("[hnsw] ensuring index…")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_dict_embedding ON dictionary_entries USING hnsw (embedding vector_cosine_ops)")
        conn.commit()
    cur.close(); conn.close(); sys.exit(0)

# ─────────────────────────── text cleanup ─────────────────────────────

# Plain-text reduction of dictionary HTML. DPPN/PED store HTML; DPD is
# plain. Strip uniformly — the model only needs the underlying text.
_TAG_RE = re.compile(r"<[^>]+>")
_ENT_RE = re.compile(r"&[a-z]+;", re.IGNORECASE)
_WS_RE  = re.compile(r"\s+")

def strip_html(s: str) -> str:
    if not s:
        return ""
    s = _TAG_RE.sub(" ", s)
    s = _ENT_RE.sub(" ", s)
    return _WS_RE.sub(" ", s).strip()

def build_input(row):
    """Prepend lemma so the embedding gives weight to the headword
    over body-only context. Truncate body to MAX_CHARS — a 70KB DPPN
    biography would otherwise dwarf the lemma signal and blow padding."""
    lemma = row["lemma"] or ""
    body = strip_html(row["definition"] or "")[:MAX_CHARS]
    return f"{lemma}: {body}"

# ─────────────────────────── embedding ────────────────────────────────

def embed_batch(texts):
    inputs = tokenizer(
        texts,
        return_tensors="np",
        padding=True,
        truncation=True,
        max_length=MAX_TOKENS,
    )
    ort_inputs = {
        "input_ids":      inputs["input_ids"].astype(np.int64),
        "attention_mask": inputs["attention_mask"].astype(np.int64),
    }
    outputs = sess.run(None, ort_inputs)
    hidden = outputs[0].astype(np.float32)              # (B, seq, 1024)
    mask = inputs["attention_mask"][:, :, None].astype(np.float32)
    pooled = (hidden * mask).sum(axis=1) / mask.sum(axis=1)
    norms = np.linalg.norm(pooled, axis=1, keepdims=True)
    return (pooled / norms).astype(np.float32)

# ─────────────────────────── main loop ────────────────────────────────

t0 = time.time()
done = 0

# Resume-friendly: refetch each round to pick up rows updated by other
# concurrent runs (none expected, but safe).
while True:
    cur.execute(
        """SELECT id, source, lemma, definition
             FROM dictionary_entries
            WHERE embedding IS NULL
            ORDER BY id
            LIMIT %s""",
        (args.fetch,),
    )
    rows = cur.fetchall()
    if not rows:
        break

    # Pack to dicts for build_input()
    fetched = [
        {"id": r[0], "source": r[1], "lemma": r[2], "definition": r[3]}
        for r in rows
    ]

    if args.limit is not None and done >= args.limit:
        break
    if args.limit is not None and done + len(fetched) > args.limit:
        fetched = fetched[: args.limit - done]

    # Embed in mini-batches across the fetched window
    for batch_start in range(0, len(fetched), args.batch):
        batch = fetched[batch_start : batch_start + args.batch]
        texts = [build_input(r) for r in batch]
        vecs = embed_batch(texts)

        update_rows = []
        for r, v in zip(batch, vecs):
            vec_str = "[" + ",".join(f"{x:.6f}" for x in v) + "]"
            update_rows.append((vec_str, r["id"]))

        # Batched UPDATE via execute_values — one round-trip per mini-batch.
        psycopg2.extras.execute_batch(
            cur,
            "UPDATE dictionary_entries SET embedding = %s::vector WHERE id = %s",
            update_rows,
            page_size=len(update_rows),
        )
        conn.commit()
        done += len(batch)

        if done % args.log_every == 0 or done == pending:
            elapsed = time.time() - t0
            rate = done / elapsed if elapsed > 0 else 0
            remaining = pending - done
            eta_s = remaining / rate if rate > 0 else 0
            print(f"  {done:>7} / {pending}  ·  {rate:>5.1f} rows/s  ·  ETA {int(eta_s//60):>3d}m{int(eta_s%60):02d}s")

    if args.limit is not None and done >= args.limit:
        break

wall = int(time.time() - t0)
print(f"\n[embed] populated {done} rows in {wall}s")

# ─────────────────────────── HNSW index ───────────────────────────────

if not args.no_hnsw:
    print("[hnsw] building per-source partial HNSW indexes…")
    cur.execute("SELECT DISTINCT source FROM dictionary_entries WHERE embedding IS NOT NULL ORDER BY source")
    sources = [r[0] for r in cur.fetchall()]
    cur.execute("SET maintenance_work_mem = '1536MB'")
    cur.execute("SET max_parallel_maintenance_workers = 0")
    for src in sources:
        idx_name = f"idx_dict_embedding_{src}"
        print(f"  building {idx_name}…")
        t_idx = time.time()
        cur.execute(
            f"CREATE INDEX IF NOT EXISTS {idx_name} ON dictionary_entries "
            f"USING hnsw (embedding vector_cosine_ops) WHERE source = %s",
            (src,),
        )
        conn.commit()
        cur.execute(f"SELECT pg_size_pretty(pg_relation_size('{idx_name}'))")
        sz = cur.fetchone()[0]
        print(f"  {idx_name}: {int(time.time() - t_idx)}s, {sz}")

cur.execute("SELECT COUNT(*) FROM dictionary_entries WHERE embedding IS NOT NULL")
filled = cur.fetchone()[0]
print(f"[done] {filled} / {total} rows have embeddings.")

cur.close()
conn.close()
