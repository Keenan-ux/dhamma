"""GPU-accelerated BGE-M3 embedding for the articles table.

Mirrors scripts/ingest/embed_translations.py but for the Library
articles ingested from Access to Insight. Same FP16 ONNX + CUDA EP
pipeline, same 1024-dim cosine space, so the JS-side embedQuery in
server/src/embed.js can match these at runtime.

Input per article: `${title}\n${body}` (HTML stripped), truncated to
MAX_CHARS=2000 — long study guides would otherwise dwarf the title
signal and blow padding. Resume-friendly via embedding IS NULL.

After population, builds a CONCURRENT HNSW index named
idx_articles_embedding so /api/search?scope=library&mode=meaning can do
vector ANN.

Run from C:\\Dev\\Dhamma\\scripts\\ingest:
    $env:DATABASE_URL = "postgres://...@localhost:15432/dhamma"
    .venv/Scripts/python.exe embed_articles.py
    .venv/Scripts/python.exe embed_articles.py --limit=50 --no-hnsw
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
ap.add_argument("--batch", type=int, default=16)
ap.add_argument("--fetch", type=int, default=128)
ap.add_argument("--log-every", type=int, default=50)
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

cur.execute("SELECT COUNT(*) FROM articles")
total = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM articles WHERE embedding IS NULL")
pending = cur.fetchone()[0]
print(f"[resume] {total} rows total, {pending} pending, {total - pending} embedded", flush=True)

def ensure_hnsw():
    # CONCURRENTLY can't run inside a transaction block. Flip autocommit,
    # build, then restore.
    print("[hnsw] building idx_articles_embedding CONCURRENTLY…", flush=True)
    # CONCURRENTLY requires no open transaction. Commit any read txn left
    # over from earlier counts before flipping autocommit.
    try: conn.commit()
    except Exception: pass
    prev_autocommit = conn.autocommit
    conn.autocommit = True
    try:
        cur.execute("SET maintenance_work_mem = '1536MB'")
        cur.execute("SET max_parallel_maintenance_workers = 0")
        t_idx = time.time()
        cur.execute(
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_embedding "
            "ON articles USING hnsw (embedding vector_cosine_ops)"
        )
        cur.execute("SELECT pg_size_pretty(pg_relation_size('idx_articles_embedding'))")
        sz = cur.fetchone()[0]
        print(f"[hnsw] built in {int(time.time() - t_idx)}s, {sz}", flush=True)
    finally:
        conn.autocommit = prev_autocommit

if pending == 0:
    print("[done] nothing to embed.", flush=True)
    if not args.no_hnsw:
        ensure_hnsw()
    cur.close(); conn.close(); sys.exit(0)

# ─────────────────────────── text cleanup ─────────────────────────

# articles.body is sanitized HTML preserving <p>, <b>, <i>, <em>, <a>.
# Strip everything for the embedder — paragraph breaks become spaces.
_TAG_RE = re.compile(r"<[^>]+>")
_ENT_RE = re.compile(r"&[a-z]+;", re.IGNORECASE)
_WS_RE  = re.compile(r"\s+")

def strip_html(s):
    if not s: return ""
    s = _TAG_RE.sub(" ", s)
    s = _ENT_RE.sub(" ", s)
    return _WS_RE.sub(" ", s).strip()

def build_input(row):
    # Title leads so the embedding gives weight to the article's topic
    # over body-only context (a long Thanissaro essay would otherwise
    # drown out a short focused title like "Mindfulness Immersed in
    # the Body"). Truncate to MAX_CHARS.
    title = (row["title"] or "").strip()
    body = strip_html(row["body"] or "")
    combined = f"{title}\n{body}" if title else body
    return combined[:MAX_CHARS]

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
        """SELECT id, title, body
             FROM articles
            WHERE embedding IS NULL
            ORDER BY id
            LIMIT %s""",
        (args.fetch,),
    )
    rows = cur.fetchall()
    if not rows:
        break

    fetched = [{"id": r[0], "title": r[1], "body": r[2]} for r in rows]
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
            "UPDATE articles SET embedding = %s::vector WHERE id = %s",
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
            print(f"  {done:>5} / {pending}  ·  {rate:>5.1f} rows/s  ·  ETA {int(eta_s//60):>3d}m{int(eta_s%60):02d}s", flush=True)

    if args.limit is not None and done >= args.limit:
        break

wall = int(time.time() - t0)
print(f"\n[embed] populated {done} rows in {wall}s", flush=True)

# ─────────────────────────── HNSW ─────────────────────────────────

if not args.no_hnsw:
    ensure_hnsw()

cur.execute("SELECT COUNT(*) FROM articles WHERE embedding IS NOT NULL")
filled = cur.fetchone()[0]
print(f"[done] {filled} / {total} rows have embeddings", flush=True)

cur.close()
conn.close()
