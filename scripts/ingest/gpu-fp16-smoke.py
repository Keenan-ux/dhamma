"""Compare BGE-M3 variants on GPU: quantized (INT8), fp16, fp32.
Reports speed and cosine sim vs stored CPU-quantized vector for the
same passage. Helps pick which model to use for the CST ingest.
"""
import os, sys, glob, time
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
TEST_ID    = "cst-s0101a.att-dn1_1"
MAX_CHARS  = 8000
N_ITERS    = 5

tokenizer = AutoTokenizer.from_pretrained(MODEL_REPO)

conn = psycopg2.connect(DB)
cur = conn.cursor()
cur.execute("SELECT original, embedding FROM passages WHERE id = %s", (TEST_ID,))
original, embedding_text = cur.fetchone()
stored_vec = np.fromstring(embedding_text.strip("[]"), sep=",", dtype=np.float32)
cur.close(); conn.close()

text = original[:MAX_CHARS]
inputs = tokenizer(text, return_tensors="np", padding=True, truncation=True, max_length=8192)
ort_inputs = {
    "input_ids":      inputs["input_ids"].astype(np.int64),
    "attention_mask": inputs["attention_mask"].astype(np.int64),
}

VARIANTS = [
    ("model_fp16.onnx",      "fp16"),
    ("model.onnx",           "fp32"),
    ("model_quantized.onnx", "int8 (baseline)"),
]

print(f"input tokens: {ort_inputs['input_ids'].shape[1]}")
print(f"{'variant':<30} {'load(s)':>10} {'first(s)':>10} {'warm(ms)':>10} {'cos vs stored':>15}")
print("-" * 80)
for fname, label in VARIANTS:
    try:
        t0 = time.time()
        path = hf_hub_download(MODEL_REPO, f"onnx/{fname}")
        sess = ort.InferenceSession(path, providers=["CUDAExecutionProvider", "CPUExecutionProvider"])
        if "CUDAExecutionProvider" not in sess.get_providers():
            print(f"{label:<30} skipped (CUDA not active)")
            continue
        load_s = time.time() - t0

        t0 = time.time()
        outs = sess.run(None, ort_inputs)
        first_s = time.time() - t0

        times = []
        for _ in range(N_ITERS):
            t0 = time.time()
            sess.run(None, ort_inputs)
            times.append((time.time() - t0) * 1000)
        warm_ms = sum(times) / len(times)

        hidden = outs[0].astype(np.float32)
        mask = inputs["attention_mask"][:, :, None].astype(np.float32)
        pooled = (hidden * mask).sum(axis=1) / mask.sum(axis=1)
        v = pooled[0] / np.linalg.norm(pooled[0])
        cos = float(np.dot(stored_vec, v.astype(np.float32)))

        print(f"{label:<30} {load_s:>10.1f} {first_s:>10.2f} {warm_ms:>10.0f} {cos:>15.4f}")
        del sess
    except Exception as e:
        print(f"{label:<30} FAIL: {e}")
