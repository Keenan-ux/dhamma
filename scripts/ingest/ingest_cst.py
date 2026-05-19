"""GPU-accelerated BGE-M3 embedding + Postgres INSERT for the CST corpus.
Reads cst-passages.jsonl (produced by cst-extract.mjs), embeds on the
local NVIDIA GPU via onnxruntime CUDA EP using the FP16 BGE-M3 ONNX
(model_fp16.onnx), and UPSERTs into the `passages` table.

Key design notes:
  - Uses the FP16 ONNX file rather than int8-quantized. FP16 is 5x faster
    on GPU than int8 (int8 incurs 336 CPU↔GPU Memcpy nodes per pass);
    cosine drift vs the stored CPU-quantized vectors is the same either
    way (~0.98), so FP16 is the clear pick.
  - Resume: pre-loads all source_edition='cst' ids and skips them.
    Same pattern as ingest-cst.mjs — both can be killed and restarted
    safely.
  - Sorts passages by length, batches by token count. Shorter passages
    fly through quickly; long ones get their own batch.
  - Ensures work rows exist before any passage references them.

Run:
    $env:DATABASE_URL = "postgres://dhamma:PASS@localhost:15432/dhamma"
    python ingest_cst.py
    python ingest_cst.py --limit=100    # smoke-test with first 100 passages
    python ingest_cst.py --batch=8      # override batch size
"""

import os, sys, glob, json, time, argparse
# Load NVIDIA CUDA DLLs from the venv-bundled nvidia-* wheels BEFORE
# importing onnxruntime — required on Windows for CUDA EP to bind.
_VENV = os.path.dirname(os.path.dirname(sys.executable))
for _bin in glob.glob(os.path.join(_VENV, "Lib", "site-packages", "nvidia", "*", "bin")):
    os.add_dll_directory(_bin)

import numpy as np
import psycopg2
import onnxruntime as ort
from transformers import AutoTokenizer
from huggingface_hub import hf_hub_download

# ─────────────────────────────── config ───────────────────────────────

MODEL_REPO = "Xenova/bge-m3"
MODEL_FILE = "onnx/model_fp16.onnx"
MAX_CHARS  = 8000
MAX_TOKENS = 8192
JSONL_PATH = os.path.join(os.path.dirname(__file__), "cst-passages.jsonl")
TRADITION  = "theravada"
EMBED_DIM  = 1024

# ─────────────────────────────── args ─────────────────────────────────

ap = argparse.ArgumentParser()
ap.add_argument("--limit", type=int, default=None,
                help="Only process first N passages (smoke test)")
ap.add_argument("--batch", type=int, default=4,
                help="Embedding batch size (4 is safe for 8GB VRAM)")
ap.add_argument("--log-every", type=int, default=50,
                help="Print progress every N passages")
args = ap.parse_args()

if not os.environ.get("DATABASE_URL"):
    print("DATABASE_URL not set", file=sys.stderr); sys.exit(1)
if not os.path.exists(JSONL_PATH):
    print(f"Missing {JSONL_PATH}. Run cst-extract.mjs first.", file=sys.stderr); sys.exit(1)

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
    print("FATAL: CUDA EP not active", file=sys.stderr); sys.exit(1)
print(f"[model] providers active: {sess.get_providers()}")

tokenizer = AutoTokenizer.from_pretrained(MODEL_REPO)

# ─────────────────────────────── DB ───────────────────────────────────

conn = psycopg2.connect(os.environ["DATABASE_URL"])
conn.autocommit = False
cur = conn.cursor()
print("[db] connected.")

cur.execute("SELECT id FROM passages WHERE source_edition='cst'")
done = {r[0] for r in cur.fetchall()}
print(f"[resume] {len(done)} CST passages already in DB; will skip")

# ─────────────────────────── ensure works ─────────────────────────────

def ensure_works(records):
    """INSERT umbrellas + per-work slugs ON CONFLICT DO NOTHING. Idempotent."""
    umbrellas = [
        ("pli-commentary",    None, "Commentaries",     "Aṭṭhakathā",              3),
        ("pli-subcommentary", None, "Sub-commentaries", "Ṭīkā",                    4),
        ("pli-anya",          None, "Extra-canonical",  "Anya · Mahāvaṃsa, etc.",  5),
    ]
    for slug, parent, name, subtitle, order in umbrellas:
        cur.execute("""
            INSERT INTO works (slug, tradition_slug, parent_slug, name, subtitle, is_stub, display_order)
            VALUES (%s, %s, %s, %s, %s, true, %s)
            ON CONFLICT (slug) DO NOTHING
        """, (slug, TRADITION, parent, name, subtitle, order))

    seen = {}
    for r in records:
        if r["work_slug"] not in seen:
            seen[r["work_slug"]] = (r["parent_slug"], r["work_name"])
    for slug, (parent, name) in seen.items():
        cur.execute("""
            INSERT INTO works (slug, tradition_slug, parent_slug, name, is_stub)
            VALUES (%s, %s, %s, %s, true)
            ON CONFLICT (slug) DO NOTHING
        """, (slug, TRADITION, parent, name))
    conn.commit()
    print(f"[works] ensured {len(umbrellas)} umbrellas + {len(seen)} per-work slugs")

# ─────────────────────────── embedding ────────────────────────────────

def embed_batch(texts):
    """Run model on a batch. Returns (B, 1024) np.float32 unit vectors."""
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
    hidden = outputs[0].astype(np.float32)                # (B, seq, 1024)
    mask = inputs["attention_mask"][:, :, None].astype(np.float32)
    pooled = (hidden * mask).sum(axis=1) / mask.sum(axis=1)  # mean pool
    norms = np.linalg.norm(pooled, axis=1, keepdims=True)
    return (pooled / norms).astype(np.float32)            # unit vectors

# ─────────────────────────── main loop ────────────────────────────────

print(f"[load] reading {JSONL_PATH}…")
records = []
with open(JSONL_PATH, "r", encoding="utf-8") as f:
    for line in f:
        r = json.loads(line)
        if r["id"] in done:
            continue
        records.append(r)
print(f"[load] {len(records)} new passages to embed")

if args.limit:
    records = records[:args.limit]
    print(f"[limit] truncated to first {len(records)}")

ensure_works(records)

# Sort by original length ascending — short passages batch fast, long
# ones get their own near-solo batches. Reduces overall padding waste.
records.sort(key=lambda r: r["original_chars"])

t0 = time.time()
inserted = 0
for batch_start in range(0, len(records), args.batch):
    batch = records[batch_start : batch_start + args.batch]
    texts = [r["original"][:MAX_CHARS] for r in batch]
    vecs = embed_batch(texts)

    for r, v in zip(batch, vecs):
        vec_str = "[" + ",".join(f"{x:.6f}" for x in v) + "]"
        cur.execute("""
            INSERT INTO passages
              (id, work_slug, position, citation, title, canon, original_lang,
               original, source_edition, xml_div_id, work_role, embedding)
            VALUES
              (%s, %s, %s, %s, %s, 'Pali', 'pli',
               %s, 'cst', %s, %s, %s::vector)
            ON CONFLICT (id) DO UPDATE SET
              work_slug      = EXCLUDED.work_slug,
              position       = EXCLUDED.position,
              citation       = EXCLUDED.citation,
              title          = EXCLUDED.title,
              original       = EXCLUDED.original,
              source_edition = EXCLUDED.source_edition,
              xml_div_id     = EXCLUDED.xml_div_id,
              work_role      = EXCLUDED.work_role,
              embedding      = EXCLUDED.embedding
        """, (
            r["id"], r["work_slug"], r["position"], r["citation"], r["title"],
            r["original"], r["xml_div_id"], r["work_role"], vec_str,
        ))
        inserted += 1

    conn.commit()

    if inserted % args.log_every == 0 or inserted == len(records):
        elapsed = time.time() - t0
        rate = inserted / elapsed if elapsed > 0 else 0
        remaining = len(records) - inserted
        eta_s = remaining / rate if rate > 0 else 0
        print(f"[{inserted}/{len(records)}] {rate:.2f}/s, ETA {int(eta_s/60)} min")

# ─────────────────────────── promote stubs ────────────────────────────

cur.execute("""
    WITH RECURSIVE live_chain AS (
      SELECT slug FROM works
       WHERE slug IN (SELECT DISTINCT work_slug FROM passages)
      UNION
      SELECT w.parent_slug
        FROM works w
        JOIN live_chain lc ON w.slug = lc.slug
       WHERE w.parent_slug IS NOT NULL
    )
    UPDATE works SET is_stub = false
     WHERE is_stub = true
       AND slug IN (SELECT slug FROM live_chain)
""")
promoted = cur.rowcount
conn.commit()

wall = int(time.time() - t0)
print(f"[done] inserted {inserted} passages; promoted {promoted} stubs to live; {wall}s wall")

cur.close()
conn.close()
