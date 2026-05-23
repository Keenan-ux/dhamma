"""Re-embed every passage with a DPD English-gloss appendix injected
after the original Pāli text. Closes the cross-language ceiling on
Meaning search for CST commentary + sub-commentary, which had no
English signal in the vector before.

Pipeline:

    input = original[:ORIG_BUDGET] + "  ⟦GLOSSARY⟧  " + gloss_appendix[:GLOSS_BUDGET]
    embedding = BGE-M3(input)  # FP16 ONNX, CUDA EP, mean-pool, L2 norm
    UPDATE passages SET embedding = … WHERE id = …
    UPSERT passages_embedding_meta(…)

Resume-friendly: passages already in the meta table at the current
gloss_version get skipped. Safe to Ctrl-C and re-run.

Run from C:\\Dev\\Dhamma\\scripts\\ingest:
    $env:DATABASE_URL = "postgres://...@localhost:15432/dhamma"
    .venv/Scripts/python.exe embed_passages_glossed.py --limit 50
    .venv/Scripts/python.exe embed_passages_glossed.py             # full corpus
    .venv/Scripts/python.exe embed_passages_glossed.py --no-reindex
"""

import os, sys, glob, time, argparse

_VENV = os.path.dirname(os.path.dirname(sys.executable))
for _bin in glob.glob(os.path.join(_VENV, "Lib", "site-packages", "nvidia", "*", "bin")):
    os.add_dll_directory(_bin)

import numpy as np
import psycopg2
import psycopg2.extras
import onnxruntime as ort
from transformers import AutoTokenizer
from huggingface_hub import hf_hub_download

from gloss_inject import GlossIndex

# ─────────────────────────── constants ────────────────────────────

MODEL_REPO = "Xenova/bge-m3"
MODEL_FILE = "onnx/model_fp16.onnx"
MAX_TOKENS = 8192          # BGE-M3 max sequence length
GLOSS_VERSION = "glossed-v1"
MODEL_TAG = "bge-m3-fp16"

# Character-budget split. Total input is at most ORIG_BUDGET + DELIM
# + GLOSS_BUDGET = ~8200 chars. The tokenizer's truncation at
# MAX_TOKENS catches the case where mixed scripts pack more tokens
# per char than expected.
ORIG_BUDGET  = 4500
GLOSS_BUDGET = 3500
DELIM = "  ⟦GLOSSARY⟧  "

# ─────────────────────────── args ─────────────────────────────────

ap = argparse.ArgumentParser()
ap.add_argument("--limit", type=int, default=None)
ap.add_argument("--batch", type=int, default=16)
ap.add_argument("--fetch", type=int, default=256)
ap.add_argument("--log-every", type=int, default=200)
ap.add_argument("--gloss-version", default=GLOSS_VERSION,
                help="Tag the meta rows with this version (default 'glossed-v1')")
ap.add_argument("--no-reindex", action="store_true",
                help="Skip the REINDEX CONCURRENTLY at the end")
ap.add_argument("--scope", choices=["all", "cst", "no-translation"], default="all",
                help="all = every passage; cst = source_edition='cst'; no-translation = passages with no translations.text row")
args = ap.parse_args()

if not os.environ.get("DATABASE_URL"):
    print("DATABASE_URL not set", file=sys.stderr); sys.exit(1)

# ─────────────────────────── model ────────────────────────────────

print(f"[model] downloading/locating {MODEL_REPO}/{MODEL_FILE}…", flush=True)
onnx_path = hf_hub_download(MODEL_REPO, MODEL_FILE)
print(f"[model] {onnx_path}", flush=True)

print("[model] creating CUDA InferenceSession…", flush=True)
sess = ort.InferenceSession(
    onnx_path,
    providers=["CUDAExecutionProvider", "CPUExecutionProvider"],
)
if "CUDAExecutionProvider" not in sess.get_providers():
    print("FATAL: CUDA EP not active —", sess.get_providers(), file=sys.stderr); sys.exit(1)
print(f"[model] providers: {sess.get_providers()}", flush=True)

tokenizer = AutoTokenizer.from_pretrained(MODEL_REPO)


def embed_batch(texts):
    """(B,) strings → (B, 1024) float32 unit vectors."""
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
    hidden = outputs[0].astype(np.float32)
    mask = inputs["attention_mask"][:, :, None].astype(np.float32)
    pooled = (hidden * mask).sum(axis=1) / mask.sum(axis=1)
    norms = np.linalg.norm(pooled, axis=1, keepdims=True)
    return (pooled / norms).astype(np.float32)


# ─────────────────────────── DB ───────────────────────────────────

conn = psycopg2.connect(os.environ["DATABASE_URL"])
conn.autocommit = False
cur = conn.cursor()
print("[db] connected.", flush=True)

# Load DPD lookup tables into RAM once.
idx = GlossIndex(conn)
idx.load()

# Build the "what to embed" candidate query for each scope. We always
# LEFT JOIN passages_embedding_meta and filter to rows that don't yet
# have a row at the current gloss_version, so the script is resumable.
scope_predicates = {
    "all":             "TRUE",
    "cst":             "p.source_edition = 'cst'",
    "no-translation":  "NOT EXISTS (SELECT 1 FROM translations t WHERE t.passage_id = p.id)",
}
scope_clause = scope_predicates[args.scope]

cur.execute(f"""
    SELECT COUNT(*) FROM passages p
     WHERE {scope_clause}
       AND p.original IS NOT NULL
       AND length(p.original) > 0
""")
in_scope = cur.fetchone()[0]
cur.execute(f"""
    SELECT COUNT(*) FROM passages p
     LEFT JOIN passages_embedding_meta m
       ON m.passage_id = p.id AND m.gloss_version = %s
     WHERE {scope_clause}
       AND p.original IS NOT NULL
       AND length(p.original) > 0
       AND m.passage_id IS NULL
""", (args.gloss_version,))
pending = cur.fetchone()[0]
print(f"[scope={args.scope}] in_scope={in_scope}  pending={pending}  done={in_scope - pending}", flush=True)

if pending == 0:
    print("[done] nothing to embed.", flush=True)
    cur.close(); conn.close(); sys.exit(0)

# ─────────────────────────── input build ──────────────────────────

def build_input(original):
    appendix, stats = idx.gloss_for(original)
    orig_part = original[:ORIG_BUDGET]
    gloss_part = appendix[:GLOSS_BUDGET]
    text = f"{orig_part}{DELIM}{gloss_part}" if gloss_part else orig_part
    stats["orig_chars"] = len(orig_part)
    stats["gloss_chars"] = len(gloss_part)
    stats["input_chars"] = len(text)
    return text, stats


# ─────────────────────────── main loop ────────────────────────────

t0 = time.time()
done = 0
loop_cur = conn.cursor()
upsert_cur = conn.cursor()

while True:
    if args.limit is not None and done >= args.limit:
        break

    loop_cur.execute(f"""
        SELECT p.id, p.original
          FROM passages p
          LEFT JOIN passages_embedding_meta m
            ON m.passage_id = p.id AND m.gloss_version = %s
         WHERE {scope_clause}
           AND p.original IS NOT NULL
           AND length(p.original) > 0
           AND m.passage_id IS NULL
         ORDER BY length(p.original)   -- short rows batch with less padding waste
         LIMIT %s
    """, (args.gloss_version, args.fetch))
    rows = loop_cur.fetchall()
    if not rows:
        break

    fetched = [{"id": r[0], "original": r[1]} for r in rows]
    if args.limit is not None and done + len(fetched) > args.limit:
        fetched = fetched[: args.limit - done]

    for i in range(0, len(fetched), args.batch):
        batch = fetched[i : i + args.batch]

        # Build inputs + per-row stats once
        built = [build_input(r["original"]) for r in batch]
        texts = [t[0] for t in built]
        statss = [t[1] for t in built]

        vecs = embed_batch(texts)

        # UPDATE passages.embedding
        updates_vec = []
        for r, v in zip(batch, vecs):
            vec_str = "[" + ",".join(f"{x:.6f}" for x in v) + "]"
            updates_vec.append((vec_str, r["id"]))
        psycopg2.extras.execute_batch(
            upsert_cur,
            "UPDATE passages SET embedding = %s::vector WHERE id = %s",
            updates_vec,
            page_size=len(updates_vec),
        )

        # UPSERT passages_embedding_meta
        meta_rows = [
            (
                r["id"], args.gloss_version,
                s["n_tokens"], s["n_headwords"], s["n_unmatched"],
                len(r["original"]), s["gloss_chars"], s["input_chars"],
                MODEL_TAG,
            )
            for r, s in zip(batch, statss)
        ]
        psycopg2.extras.execute_batch(
            upsert_cur,
            """INSERT INTO passages_embedding_meta
                 (passage_id, gloss_version, n_tokens, n_headwords, n_unmatched,
                  orig_chars, gloss_chars, input_chars, model)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
               ON CONFLICT (passage_id) DO UPDATE SET
                 gloss_version = EXCLUDED.gloss_version,
                 embedded_at   = NOW(),
                 n_tokens      = EXCLUDED.n_tokens,
                 n_headwords   = EXCLUDED.n_headwords,
                 n_unmatched   = EXCLUDED.n_unmatched,
                 orig_chars    = EXCLUDED.orig_chars,
                 gloss_chars   = EXCLUDED.gloss_chars,
                 input_chars   = EXCLUDED.input_chars,
                 model         = EXCLUDED.model""",
            meta_rows,
            page_size=len(meta_rows),
        )

        conn.commit()
        done += len(batch)

        if done % args.log_every == 0 or done == pending or (args.limit and done == args.limit):
            elapsed = time.time() - t0
            rate = done / elapsed if elapsed > 0 else 0
            remaining = (args.limit or pending) - done
            eta_s = remaining / rate if rate > 0 else 0
            avg_input = sum(s["input_chars"] for s in statss) / len(statss)
            print(f"  {done:>6} / {pending}  ·  {rate:>5.2f} rows/s  ·  ETA {int(eta_s//60):>3d}m{int(eta_s%60):02d}s  ·  avg_in={int(avg_input)}c", flush=True)

        if args.limit is not None and done >= args.limit:
            break

wall = int(time.time() - t0)
print(f"\n[embed] populated {done} rows in {wall}s ({done / max(wall, 1):.2f} rows/s avg)", flush=True)

# ─────────────────────────── HNSW reindex ─────────────────────────

if not args.no_reindex and args.limit is None:
    # Full corpus pass: the HNSW graph is stale because every vector
    # was overwritten. REINDEX CONCURRENTLY keeps the live site
    # responsive — it builds a new index alongside the old, then
    # atomic-swaps. Slower than a plain REINDEX but doesn't block reads.
    print("[hnsw] REINDEX CONCURRENTLY idx_passages_embedding…", flush=True)
    conn.autocommit = True
    t_idx = time.time()
    try:
        cur.execute("REINDEX INDEX CONCURRENTLY idx_passages_embedding")
        print(f"[hnsw] reindexed in {int(time.time() - t_idx)}s", flush=True)
    except Exception as e:
        print(f"[hnsw] REINDEX failed: {e}", flush=True)
        print("[hnsw] you can run REINDEX INDEX idx_passages_embedding manually", flush=True)
    conn.autocommit = False

cur.close(); upsert_cur.close(); loop_cur.close()
conn.close()
