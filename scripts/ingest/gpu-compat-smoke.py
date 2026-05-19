"""Verify that BGE-M3 on GPU (via onnxruntime CUDA EP) produces vectors
that are cosine-compatible with the existing Node/Xenova CPU embeddings.

Pulls one known CST passage from prod DB, re-embeds its text on GPU,
and computes cosine similarity against the stored vector. Must be > 0.99
to commit to the GPU rewrite.

Run:
  $env:DATABASE_URL = "postgres://dhamma:PASS@localhost:15432/dhamma"
  python gpu-compat-smoke.py
"""
import os, sys, glob, time

# Make NVIDIA DLLs discoverable BEFORE importing onnxruntime — otherwise
# CUDA EP silently falls back to CPU on Windows.
_VENV = os.path.dirname(os.path.dirname(sys.executable))
for _bin in glob.glob(os.path.join(_VENV, "Lib", "site-packages", "nvidia", "*", "bin")):
    os.add_dll_directory(_bin)

import numpy as np
import psycopg2
import onnxruntime as ort
from transformers import AutoTokenizer
from huggingface_hub import hf_hub_download

DB = os.environ["DATABASE_URL"]
MODEL_REPO = "Xenova/bge-m3"
ONNX_FILE  = "onnx/model_quantized.onnx"   # the file Node @xenova downloads
TEST_ID    = "cst-s0101a.att-dn1_1"
MAX_CHARS  = 8000

print(f"[compat] downloading/locating {MODEL_REPO}/{ONNX_FILE}…")
onnx_path = hf_hub_download(MODEL_REPO, ONNX_FILE)
print(f"[compat] onnx file: {onnx_path}")

print(f"[compat] creating InferenceSession with CUDAExecutionProvider…")
sess = ort.InferenceSession(
    onnx_path,
    providers=["CUDAExecutionProvider", "CPUExecutionProvider"],
)
active_providers = sess.get_providers()
print(f"[compat] active providers: {active_providers}")
if "CUDAExecutionProvider" not in active_providers:
    print("[compat] FATAL: CUDA provider not active — GPU is not being used")
    sys.exit(1)

tokenizer = AutoTokenizer.from_pretrained(MODEL_REPO)

print(f"[compat] pulling stored vector for {TEST_ID}…")
conn = psycopg2.connect(DB)
cur = conn.cursor()
cur.execute("SELECT original, embedding FROM passages WHERE id = %s", (TEST_ID,))
row = cur.fetchone()
if row is None:
    print(f"[compat] FATAL: {TEST_ID} not in DB")
    sys.exit(1)
original, embedding_text = row
stored_vec = np.fromstring(embedding_text.strip("[]"), sep=",", dtype=np.float32)
print(f"[compat] stored vec dim={stored_vec.shape[0]} norm={np.linalg.norm(stored_vec):.6f}")

# Embed via GPU. Match Node params: mean pooling over tokens + L2 normalize.
text = original[:MAX_CHARS]
inputs = tokenizer(text, return_tensors="np", padding=True, truncation=True, max_length=8192)
# Cast to int64 (BGE-M3 expects that)
ort_inputs = {
    "input_ids":      inputs["input_ids"].astype(np.int64),
    "attention_mask": inputs["attention_mask"].astype(np.int64),
}

# Warm up + time
t0 = time.time()
outputs = sess.run(None, ort_inputs)
warm_ms = (time.time() - t0) * 1000
hidden = outputs[0]  # (1, seq_len, 1024)
mask = inputs["attention_mask"][:, :, None].astype(np.float32)
pooled = (hidden * mask).sum(axis=1) / mask.sum(axis=1)
gpu_vec = pooled[0] / np.linalg.norm(pooled[0])
gpu_vec = gpu_vec.astype(np.float32)
print(f"[compat] gpu vec dim={gpu_vec.shape[0]} norm={np.linalg.norm(gpu_vec):.6f}")
print(f"[compat] first embed: {warm_ms:.0f}ms (includes CUDA stream warmup)")

# Run 3 more times to get steady-state timing
times = []
for _ in range(3):
    t0 = time.time()
    sess.run(None, ort_inputs)
    times.append((time.time() - t0) * 1000)
print(f"[compat] steady-state: {sum(times)/len(times):.0f}ms (mean of 3)")

cos = float(np.dot(stored_vec, gpu_vec))
print(f"\n[compat] cosine similarity: {cos:.6f}")
if cos > 0.99:
    print("[compat] PASS — vectors compatible, proceed with GPU rewrite")
elif cos > 0.95:
    print("[compat] MARGINAL — drift exists, search rankings will differ subtly")
else:
    print("[compat] FAIL — vector spaces have diverged, do NOT use this pipeline alongside SC vectors")

cur.close()
conn.close()
