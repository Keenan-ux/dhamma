"""GPU-accelerated BGE-M3 embedding for the translations table.

Mirrors scripts/ingest/embed_dict.py but for translations rows. Same
FP16 ONNX + CUDA EP pipeline, same 1024-dim cosine space. Once filled,
runSearch's Meaning mode against field='translation' can do vector ANN
across every translator's text — a query for "the chief disciple known
for wisdom" then returns the best-matching passage AND surfaces which
translator's rendering scored highest.

Resume-friendly: only rows where embedding IS NULL get touched. After
the population pass, builds an HNSW index for fast ANN.

Run from C:\\Dev\\Dhamma\\scripts\\ingest:
    $env:DATABASE_URL = "postgres://...@localhost:15432/dhamma"
    .venv/Scripts/python.exe embed_translations.py
    .venv/Scripts/python.exe embed_translations.py --limit=200 --no-hnsw
"""

import os, sys, glob, time, re, argparse

_VENV = os.path.dirname(os.path.dirname(sys.executable))
for _bin in glob.glob(os.path.join(_VENV, "Lib", "site-packages", "nvidia", "*", "bin")):
    os.add_dll_directory(_bin)

import numpy as np
import psycopg2
import psycopg2.extras
import onnxruntime as ort
from transformers import AutoTokenizer
from huggingface_hub import hf_hub_download

MODEL_REPO = "Xenova/bge-m3"
MODEL_FILE = "onnx/model_fp16.onnx"
MAX_CHARS  = 2000
MAX_TOKENS = 8192

ap = argparse.ArgumentParser()
ap.add_argument("--limit", type=int, default=None)
ap.add_argument("--batch", type=int, default=32)
ap.add_argument("--fetch", type=int, default=256)
ap.add_argument("--log-every", type=int, default=500)
ap.add_argument("--no-hnsw", action="store_true")
args = ap.parse_args()

if not os.environ.get("DATABASE_URL"):
    print("DATABASE_URL not set", file=sys.stderr); sys.exit(1)

# ─────────────────────────── model ────────────────────────────────

print(f"[model] downloading/locating {MODEL_REPO}/{MODEL_FILE}…", flush=True)
onnx_path = hf_hub_download(MODEL_REPO, MODEL_FILE)
print(f"[model] {onnx_path}", flush=True)

print(f"[model] creating CUDA InferenceSession…", flush=True)
sess = ort.InferenceSession(
    onnx_path,
    providers=["CUDAExecutionProvider", "CPUExecutionProvider"],
)
if "CUDAExecutionProvider" not in sess.get_providers():
    print("FATAL: CUDA EP not active —", sess.get_providers(), file=sys.stderr); sys.exit(1)
print(f"[model] providers: {sess.get_providers()}", flush=True)

tokenizer = AutoTokenizer.from_pretrained(MODEL_REPO)

# ─────────────────────────── DB ───────────────────────────────────

conn = psycopg2.connect(os.environ["DATABASE_URL"])
conn.autocommit = False
cur = conn.cursor()
print("[db] connected.", flush=True)

cur.execute("SELECT COUNT(*) FROM translations")
total = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM translations WHERE embedding IS NULL")
pending = cur.fetchone()[0]
print(f"[resume] {total} rows total, {pending} pending, {total - pending} embedded", flush=True)

if pending == 0:
    print("[done] nothing to embed.", flush=True)
    if not args.no_hnsw:
        print("[hnsw] ensuring index…", flush=True)
        cur.execute("CREATE INDEX IF NOT EXISTS idx_translations_embedding ON translations USING hnsw (embedding vector_cosine_ops)")
        conn.commit()
    cur.close(); conn.close(); sys.exit(0)

# ─────────────────────────── text cleanup ─────────────────────────

# ATI translations are stored as light HTML; SC translations are plain.
# Strip tags + entities so the embedder sees clean prose.
_TAG_RE = re.compile(r"<[^>]+>")
_ENT_RE = re.compile(r"&[a-z]+;", re.IGNORECASE)
_WS_RE  = re.compile(r"\s+")

def strip_html(s):
    if not s: return ""
    s = _TAG_RE.sub(" ", s)
    s = _ENT_RE.sub(" ", s)
    return _WS_RE.sub(" ", s).strip()

def build_input(row):
    # Prepend the citation so a meaning-mode query for "Anāthapiṇḍika's
    # advice to the householder" gets a small boost where the canonical
    # ID is the disambiguator. Truncate to MAX_CHARS.
    text = strip_html(row["text"])[:MAX_CHARS]
    return f"{row['citation']}: {text}"

# ─────────────────────────── embedding ────────────────────────────

def embed_batch(texts):
    inputs = tokenizer(texts, return_tensors="np", padding=True, truncation=True, max_length=MAX_TOKENS)
    ort_inputs = {
        "input_ids":      inputs["input_ids"].astype(np.int64),
        "attention_mask": inputs["attention_mask"].astype(np.int64),
    }
    outputs = sess.run(None, ort_inputs)
    hidden = outputs[0].astype(np.float32)
    mask = inputs["attention_mask"][:, :, None].astype(np.float32)
    pooled = (hidden * mask).sum(axis=1) / mask.sum(axis=1)
    norms = np.linalg.norm(pooled, axis=1, keepdims=True)
    return (pooled / norms).astype(np.float32)

# ─────────────────────────── main loop ────────────────────────────

t0 = time.time()
done = 0

while True:
    cur.execute(
        """SELECT t.id, t.text, p.citation
             FROM translations t
             JOIN passages p ON p.id = t.passage_id
            WHERE t.embedding IS NULL
            ORDER BY t.id
            LIMIT %s""",
        (args.fetch,),
    )
    rows = cur.fetchall()
    if not rows:
        break

    fetched = [{"id": r[0], "text": r[1], "citation": r[2]} for r in rows]
    if args.limit is not None and done >= args.limit:
        break
    if args.limit is not None and done + len(fetched) > args.limit:
        fetched = fetched[: args.limit - done]

    for i in range(0, len(fetched), args.batch):
        batch = fetched[i : i + args.batch]
        texts = [build_input(r) for r in batch]
        vecs = embed_batch(texts)

        updates = []
        for r, v in zip(batch, vecs):
            vec_str = "[" + ",".join(f"{x:.6f}" for x in v) + "]"
            updates.append((vec_str, r["id"]))

        psycopg2.extras.execute_batch(
            cur,
            "UPDATE translations SET embedding = %s::vector WHERE id = %s",
            updates,
            page_size=len(updates),
        )
        conn.commit()
        done += len(batch)

        if done % args.log_every == 0 or done == pending:
            elapsed = time.time() - t0
            rate = done / elapsed if elapsed > 0 else 0
            remaining = pending - done
            eta_s = remaining / rate if rate > 0 else 0
            print(f"  {done:>6} / {pending}  ·  {rate:>5.1f} rows/s  ·  ETA {int(eta_s//60):>3d}m{int(eta_s%60):02d}s", flush=True)

    if args.limit is not None and done >= args.limit:
        break

wall = int(time.time() - t0)
print(f"\n[embed] populated {done} rows in {wall}s", flush=True)

# ─────────────────────────── HNSW ─────────────────────────────────

if not args.no_hnsw:
    print("[hnsw] building HNSW index on translations.embedding…", flush=True)
    cur.execute("SET maintenance_work_mem = '1536MB'")
    cur.execute("SET max_parallel_maintenance_workers = 0")
    t_idx = time.time()
    cur.execute("CREATE INDEX IF NOT EXISTS idx_translations_embedding ON translations USING hnsw (embedding vector_cosine_ops)")
    conn.commit()
    cur.execute("SELECT pg_size_pretty(pg_relation_size('idx_translations_embedding'))")
    sz = cur.fetchone()[0]
    print(f"[hnsw] built in {int(time.time() - t_idx)}s, {sz}", flush=True)

cur.execute("SELECT COUNT(*) FROM translations WHERE embedding IS NOT NULL")
filled = cur.fetchone()[0]
print(f"[done] {filled} / {total} rows have embeddings", flush=True)

cur.close()
conn.close()
