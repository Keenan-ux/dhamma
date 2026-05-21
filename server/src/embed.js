// BGE-M3 query embedding. Singleton — the ONNX pipeline is loaded once at
// boot and held in memory for the life of the process.
//
// Vectors produced here MUST live in the same space as the corpus vectors
// produced by scripts/ingest/ingest.mjs. Keep model name, quantization, and
// pooling/normalize options in lockstep with that file.

import { pipeline, env } from '@huggingface/transformers';
import path from 'node:path';

const MODEL = 'Xenova/bge-m3';

env.cacheDir = process.env.MODEL_CACHE_DIR || path.resolve('.model-cache');
env.allowRemoteModels = true;

let _pipe = null;
let _readyPromise = null;

export function embedReady() {
  if (!_readyPromise) {
    _readyPromise = (async () => {
      const t0 = Date.now();
      _pipe = await pipeline('feature-extraction', MODEL, { dtype: 'q8' });
      console.log(`[embed] BGE-M3 ready in ${Date.now() - t0}ms (cacheDir=${env.cacheDir})`);
    })();
  }
  return _readyPromise;
}

export async function embedQuery(text) {
  if (!_pipe) await embedReady();
  const q = String(text ?? '').slice(0, 2000);
  const out = await _pipe(q, { pooling: 'mean', normalize: true });
  return Array.from(out.data);
}
