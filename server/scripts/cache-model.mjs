// Pre-download BGE-M3 quantized ONNX into the image at build time.
// Without this the running container would have to fetch ~265 MB from
// Hugging Face on first boot — bad for cold-start latency and brittle if
// HF is slow or rate-limited.
//
// Invoked from the Dockerfile after `npm install`. MODEL_CACHE_DIR must
// point at a writable path inside the image (set in the Dockerfile).

import { pipeline, env } from '@huggingface/transformers';

env.cacheDir = process.env.MODEL_CACHE_DIR || '/app/.model-cache';
env.allowRemoteModels = true;

console.log(`[cache] downloading Xenova/bge-m3 (dtype=q8) → ${env.cacheDir}`);
await pipeline('feature-extraction', 'Xenova/bge-m3', { dtype: 'q8' });
console.log('[cache] done.');
