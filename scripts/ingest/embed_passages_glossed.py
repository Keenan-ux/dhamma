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
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor

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

# ─────────────────────────── worker (multiprocessing) ─────────────
#
# When `--gloss-workers > 1`, gloss builds run in a ProcessPoolExecutor.
# Each worker process loads its own GlossIndex from the DB at startup
# (~12s × N workers, paid once). This bypasses the GIL — pure Python
# parallelism on the dict-lookup-heavy gloss_for path. On Windows the
# pool uses `spawn`, which re-imports this module per worker; the
# worker init function below must therefore be at module top level
# and re-import psycopg2 + GlossIndex itself.

_WORKER_IDX = None
_WORKER_BUDGETS = (4500, 3500, "  ⟦GLOSSARY⟧  ")  # (orig, gloss, delim)

def _worker_init(database_url, orig_budget, gloss_budget, delim):
    """Per-worker GlossIndex init. Runs once when the worker starts."""
    global _WORKER_IDX, _WORKER_BUDGETS
    _WORKER_BUDGETS = (orig_budget, gloss_budget, delim)
    import psycopg2 as _pg
    from gloss_inject import GlossIndex as _GI
    conn = _pg.connect(database_url,
                       keepalives=1, keepalives_idle=30,
                       keepalives_interval=10, keepalives_count=3)
    _WORKER_IDX = _GI(conn)
    _WORKER_IDX.load()
    # Drop the conn — index is fully in-memory after load()
    conn.close()

def _worker_build_input(original):
    """Mirror of build_input(), invoked in a worker process."""
    orig_b, gloss_b, delim = _WORKER_BUDGETS
    appendix, stats = _WORKER_IDX.gloss_for(original)
    orig_part = original[:orig_b]
    gloss_part = appendix[:gloss_b]
    text = f"{orig_part}{delim}{gloss_part}" if gloss_part else orig_part
    stats["orig_chars"] = len(orig_part)
    stats["gloss_chars"] = len(gloss_part)
    stats["input_chars"] = len(text)
    return text, stats

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
ap.add_argument("--gloss-workers", type=int, default=4,
                help="Threads building DPD gloss appendices in parallel. "
                     "Most per-row work is Python dict/regex over the inflection "
                     "table; threading + GIL release on those operations gives "
                     "a 2-3x throughput lift when the GPU sits idle.")
ap.add_argument("--fetch", type=int, default=256)
ap.add_argument("--log-every", type=int, default=200)
ap.add_argument("--gloss-version", default=GLOSS_VERSION,
                help="Tag the meta rows with this version (default 'glossed-v1')")
ap.add_argument("--no-reindex", action="store_true",
                help="Skip the REINDEX CONCURRENTLY at the end")
ap.add_argument("--scope", choices=["all", "cst", "attha", "tika", "no-translation"], default="all",
                help="all = every passage; cst = source_edition='cst'; "
                     "attha = CST aṭṭhakathā + mula (commentary + Vism); "
                     "tika = CST ṭīkā only (slow, ~5x slower than attha — defer if pressed); "
                     "no-translation = passages with no translations.text row")
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
#
# TCP keepalive on libpq makes the OS evict dead proxy connections in
# ~30s instead of hanging on a write forever — the failure mode we saw
# when a momentary internet drop broke the `flyctl proxy 15432` tunnel
# but psycopg2 had no way to know.

DB_CONNECT_KWARGS = dict(
    keepalives=1,
    keepalives_idle=30,
    keepalives_interval=10,
    keepalives_count=3,
)

def open_db():
    c = psycopg2.connect(os.environ["DATABASE_URL"], **DB_CONNECT_KWARGS)
    c.autocommit = False
    return c

conn = open_db()
cur = conn.cursor()
print("[db] connected (with TCP keepalive).", flush=True)

# Load DPD lookup tables into RAM once.
idx = GlossIndex(conn)
idx.load()

# Build the "what to embed" candidate query for each scope. We always
# LEFT JOIN passages_embedding_meta and filter to rows that don't yet
# have a row at the current gloss_version, so the script is resumable.
scope_predicates = {
    "all":             "TRUE",
    "cst":             "p.source_edition = 'cst'",
    # 'attha' is the high-value CST scope: Aṭṭhakathā + Vism (which
    # is role='mula' in the schema but is content-wise commentary).
    # Skip 'tika' here because ṭīkā passages are ~5x slower to gloss
    # (longer + more grammatical-analytic per word) and contain the
    # least cross-language search value; defer them to a separate
    # pass — see TIKA_REEMBED_DEFERRED.md.
    "attha":           "p.source_edition = 'cst' AND p.work_role IN ('attha', 'mula')",
    "tika":            "p.source_edition = 'cst' AND p.work_role = 'tika'",
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

# Thread pool for parallel gloss builds. The GlossIndex lookup is
# almost entirely Python dict + regex operations; both release the
# GIL frequently enough that a few threads can starve the GPU less
# when the CPU side is the bottleneck.
gloss_pool = ThreadPoolExecutor(max_workers=args.gloss_workers)
print(f"[pool] gloss_workers={args.gloss_workers}", flush=True)

def reconnect_db():
    """Re-open the DB connection and rebuild all cursors after a
    network drop. Returns the new (conn, loop_cur, upsert_cur, cur)
    tuple. Used by run_with_retry below when an OperationalError
    fires mid-batch — the flyctl proxy occasionally drops the TCP
    tunnel during brief internet hiccups, and the OS-level keepalive
    + this retry cover the gap so the script finishes in one run."""
    global conn, loop_cur, upsert_cur, cur
    try:
        conn.close()
    except Exception:
        pass
    print("[db] reconnecting…", flush=True)
    for attempt in range(20):
        try:
            conn = open_db()
            loop_cur = conn.cursor()
            upsert_cur = conn.cursor()
            cur = conn.cursor()
            print(f"[db] reconnected (attempt {attempt + 1}).", flush=True)
            return
        except Exception as e:
            wait = min(2 ** attempt, 30)
            print(f"[db] reconnect attempt {attempt + 1} failed: {e}; retrying in {wait}s", flush=True)
            time.sleep(wait)
    raise RuntimeError("[db] reconnect failed after 20 attempts")

def run_with_retry(fn, *fnargs, max_retries=4):
    """Run a DB op; on OperationalError reconnect and retry up to
    max_retries times. Anything else propagates."""
    for attempt in range(max_retries + 1):
        try:
            return fn(*fnargs)
        except (psycopg2.OperationalError, psycopg2.InterfaceError) as e:
            if attempt == max_retries:
                raise
            print(f"[db] write failed ({type(e).__name__}: {e}); reconnecting", flush=True)
            reconnect_db()

def fetch_next_batch():
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
    return loop_cur.fetchall()

while True:
    if args.limit is not None and done >= args.limit:
        break

    rows = run_with_retry(fetch_next_batch)
    if not rows:
        break

    fetched = [{"id": r[0], "original": r[1]} for r in rows]
    if args.limit is not None and done + len(fetched) > args.limit:
        fetched = fetched[: args.limit - done]

    for i in range(0, len(fetched), args.batch):
        batch = fetched[i : i + args.batch]

        # Build inputs + per-row stats once, in parallel across the
        # gloss pool. With workers=4 the per-batch wall time drops
        # ~2-3x on long passages where the DPD lookup dominates.
        built = list(gloss_pool.map(lambda r: build_input(r["original"]), batch))
        texts = [t[0] for t in built]
        statss = [t[1] for t in built]

        vecs = embed_batch(texts)

        # UPDATE passages.embedding + UPSERT meta. Wrap in
        # run_with_retry so a momentary internet drop (which makes
        # `flyctl proxy 15432` drop the TCP tunnel) reconnects
        # transparently instead of hanging the writer thread.
        updates_vec = []
        for r, v in zip(batch, vecs):
            vec_str = "[" + ",".join(f"{x:.6f}" for x in v) + "]"
            updates_vec.append((vec_str, r["id"]))
        meta_rows = [
            (
                r["id"], args.gloss_version,
                s["n_tokens"], s["n_headwords"], s["n_unmatched"],
                len(r["original"]), s["gloss_chars"], s["input_chars"],
                MODEL_TAG,
            )
            for r, s in zip(batch, statss)
        ]

        def write_batch():
            psycopg2.extras.execute_batch(
                upsert_cur,
                "UPDATE passages SET embedding = %s::vector WHERE id = %s",
                updates_vec,
                page_size=len(updates_vec),
            )
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
        run_with_retry(write_batch)

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
