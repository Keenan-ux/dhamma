r"""GPU embed pass for the sentence-chunking re-embed (Phase 6 step 2).

Fills passage_sentences.embedding for rows the segment pass inserted with
embedding=NULL. A focused fork of embed_passages_glossed.py: same BGE-M3
CUDA load, same embed_batch, same memory-budgeted dynamic batching, same
TCP-keepalive + reconnect-with-retry, same detached-launch friendliness.
What is dropped vs. the gloss embedder: no DPD gloss injection and no
gloss-worker pool. A sentence is short; appending a multi-hundred-char
gloss appendix would swamp its own signal and defeat sentence
granularity. Sentences embed as raw text. Cross-language recall is
already carried by the passage-level glossed-v1 vectors and the vec_t
translation lane; the sentence lane is for snippet precision.

Resume-friendly: pending = rows WHERE embedding IS NULL. Keyset
pagination on the (passage_id, field, position) PK avoids the
named-cursor-invalidated-by-commit failure and advances cleanly.

Launch detached so it survives the shell / a Claude Code restart:
    $env:DATABASE_URL = "postgres://...@localhost:15432/dhamma"
    Start-Process -FilePath .venv\Scripts\python.exe `
      -ArgumentList "embed_sentences.py","--batch=64","--fetch=1024" `
      -WorkingDirectory "C:\Dev\Dhamma\scripts\ingest" -WindowStyle Hidden `
      -RedirectStandardOutput logs\embed-sentences.out.log `
      -RedirectStandardError  logs\embed-sentences.err.log
"""

import os, sys, glob, time, argparse

# CUDA DLLs ship inside the venv's nvidia-* packages on Windows; add them
# to the DLL search path before onnxruntime loads, exactly as the gloss
# embedder does.
_VENV = os.path.dirname(os.path.dirname(sys.executable))
for _bin in glob.glob(os.path.join(_VENV, "Lib", "site-packages", "nvidia", "*", "bin")):
    try:
        os.add_dll_directory(_bin)
    except Exception:
        pass

import numpy as np
import psycopg2
import psycopg2.extras
import onnxruntime as ort
from transformers import AutoTokenizer
from huggingface_hub import hf_hub_download

MODEL_REPO = "Xenova/bge-m3"
MODEL_FILE = "onnx/model_fp16.onnx"
MAX_TOKENS = 8192

DB_CONNECT_KWARGS = dict(keepalives=1, keepalives_idle=30,
                         keepalives_interval=10, keepalives_count=3)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--batch", type=int, default=64,
                    help="MAX rows per GPU call (sentences are short, so 64 is "
                         "safe; --mem-budget shrinks it for the rare long one).")
    ap.add_argument("--mem-budget", type=int, default=85_000_000,
                    help="Cap each GPU batch so rows*max_chars^2 <= this. "
                         "Calibrated on the 8 GB card; most sentence batches hit "
                         "the --batch cap, not this.")
    ap.add_argument("--fetch", type=int, default=1024)
    ap.add_argument("--field", choices=["original", "translation"], default=None,
                    help="Restrict to one field; default embeds all pending.")
    ap.add_argument("--limit", type=int, default=None, help="Cap rows embedded (pilot).")
    ap.add_argument("--log-every", type=int, default=2000)
    args = ap.parse_args()

    if not os.environ.get("DATABASE_URL"):
        print("DATABASE_URL not set", file=sys.stderr); sys.exit(1)

    print(f"[model] locating {MODEL_REPO}/{MODEL_FILE}", flush=True)
    onnx_path = hf_hub_download(MODEL_REPO, MODEL_FILE)
    print("[model] creating CUDA InferenceSession", flush=True)
    sess = ort.InferenceSession(onnx_path,
                                providers=["CUDAExecutionProvider", "CPUExecutionProvider"])
    if "CUDAExecutionProvider" not in sess.get_providers():
        print("FATAL: CUDA EP not active:", sess.get_providers(), file=sys.stderr); sys.exit(1)
    print(f"[model] providers: {sess.get_providers()}", flush=True)
    tokenizer = AutoTokenizer.from_pretrained(MODEL_REPO)

    def embed_batch(texts):
        inputs = tokenizer(texts, return_tensors="np", padding=True,
                           truncation=True, max_length=MAX_TOKENS)
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

    def open_db():
        c = psycopg2.connect(os.environ["DATABASE_URL"], **DB_CONNECT_KWARGS)
        c.autocommit = False
        return c

    conn = open_db()
    cur = conn.cursor()
    print("[db] connected (TCP keepalive).", flush=True)

    field_clause = "AND field = %s" if args.field else ""
    field_params = (args.field,) if args.field else ()

    cur.execute(f"SELECT COUNT(*) FROM passage_sentences WHERE embedding IS NULL {field_clause}",
                field_params)
    pending = cur.fetchone()[0]
    print(f"[scope] pending sentence rows: {pending}"
          + (f" (field={args.field})" if args.field else ""), flush=True)
    if pending == 0:
        print("[done] nothing to embed.", flush=True); conn.close(); return

    def reconnect_db():
        nonlocal conn, cur, fetch_cur, upd_cur
        try: conn.close()
        except Exception: pass
        for attempt in range(20):
            try:
                conn = open_db()
                cur = conn.cursor()
                # fetch_cur MUST be a DictCursor: reads below use string keys
                # (row["passage_id"], row["text"]). A plain cursor here would
                # return tuples and raise TypeError on the first reconnect.
                fetch_cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
                upd_cur = conn.cursor()
                print(f"[db] reconnected (attempt {attempt+1}).", flush=True)
                return
            except Exception as e:
                wait = min(2 ** attempt, 30)
                print(f"[db] reconnect {attempt+1} failed: {e}; retry {wait}s", flush=True)
                time.sleep(wait)
        raise RuntimeError("[db] reconnect failed after 20 attempts")

    def run_with_retry(fn, *a, max_retries=4):
        for attempt in range(max_retries + 1):
            try:
                return fn(*a)
            except (psycopg2.OperationalError, psycopg2.InterfaceError) as e:
                if attempt == max_retries:
                    raise
                print(f"[db] op failed ({type(e).__name__}: {e}); reconnecting", flush=True)
                reconnect_db()

    fetch_cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    upd_cur = conn.cursor()
    # Keyset over the composite PK. ('', '', -1) sorts before any real row.
    last = ("", "", -1)
    select_sql = f"""
        SELECT passage_id, field, position, text
          FROM passage_sentences
         WHERE embedding IS NULL {field_clause}
           AND (passage_id, field, position) > (%s, %s, %s)
         ORDER BY passage_id, field, position
         LIMIT %s
    """

    t0 = time.time()
    done = 0
    last_logged = 0

    def fetch_page():
        fetch_cur.execute(select_sql, (*field_params, last[0], last[1], last[2], take))
        return fetch_cur.fetchall()

    while True:
        if args.limit is not None and done >= args.limit:
            break
        take = args.fetch
        if args.limit is not None:
            take = min(take, args.limit - done)
        rows = run_with_retry(fetch_page)
        if not rows:
            break
        last = (rows[-1]["passage_id"], rows[-1]["field"], rows[-1]["position"])

        # Memory-budgeted GPU batches: grow until rows*max_len^2 > budget or
        # we hit --batch. The j>i guard keeps a lone over-budget row valid.
        i, n = 0, len(rows)
        while i < n:
            j = i
            maxlen = 0
            while j < n and (j - i) < args.batch:
                tl = len(rows[j]["text"])
                nm = tl if tl > maxlen else maxlen
                if j > i and (j - i + 1) * nm * nm > args.mem_budget:
                    break
                maxlen = nm
                j += 1
            sub = rows[i:j]
            i = j
            vecs = embed_batch([r["text"] for r in sub])
            updates = []
            for r, v in zip(sub, vecs):
                vec_str = "[" + ",".join(f"{x:.6f}" for x in v) + "]"
                updates.append((vec_str, r["passage_id"], r["field"], r["position"]))

            def write_batch():
                psycopg2.extras.execute_batch(
                    upd_cur,
                    "UPDATE passage_sentences SET embedding = %s::vector "
                    "WHERE passage_id = %s AND field = %s AND position = %s",
                    updates, page_size=len(updates),
                )
                conn.commit()
            run_with_retry(write_batch)
            done += len(sub)

            if (done - last_logged) >= args.log_every or (args.limit and done >= args.limit):
                last_logged = done
                el = time.time() - t0
                rate = done / el if el else 0
                remaining = (args.limit or pending) - done
                eta = remaining / rate if rate else 0
                print(f"  {done:>7} / {args.limit or pending}  ·  {rate:5.1f} rows/s  ·  "
                      f"ETA {int(eta//3600)}h{int((eta%3600)//60):02d}m  ·  batch={len(sub)}", flush=True)
            if args.limit is not None and done >= args.limit:
                break

    wall = int(time.time() - t0)
    print(f"\n[embed-sentences] {done} rows in {wall}s ({done/max(wall,1):.1f} rows/s avg)", flush=True)
    cur.close(); conn.close()


if __name__ == "__main__":
    main()
