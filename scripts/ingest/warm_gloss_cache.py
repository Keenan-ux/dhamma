"""Standalone warmer for the DPD GlossIndex pickle cache.

Reads the 88K DPD entries + 728K inflection rows from Postgres (via
the flyctl proxy) and writes the result to
`scripts/ingest/.cache/gloss_index.pkl` so the main embed script can
load it in ~5 seconds on next start instead of ~30 minutes.

Run from C:\\Dev\\Dhamma\\scripts\\ingest:
    $env:DATABASE_URL = "postgres://...@localhost:15432/dhamma"
    .venv/Scripts/python.exe warm_gloss_cache.py

Safe to run alongside the embed — read-only and small footprint.
"""

import os
import sys
import psycopg2

from gloss_inject import GlossIndex, DEFAULT_CACHE_PATH

if not os.environ.get("DATABASE_URL"):
    print("DATABASE_URL not set", file=sys.stderr)
    sys.exit(1)

conn = psycopg2.connect(
    os.environ["DATABASE_URL"],
    keepalives=1, keepalives_idle=30,
    keepalives_interval=10, keepalives_count=3,
)
print(f"[warm] connected; building cache at {DEFAULT_CACHE_PATH}", flush=True)

idx = GlossIndex(conn)
# Force a DB load (cache_path is passed so the write happens at the
# end, but we pretend the existing cache doesn't exist by removing it
# first if you want a forced rebuild — here we want "use cache if
# present, else build", which is the default behavior).
idx.load(cache_path=DEFAULT_CACHE_PATH, write_cache=True)

conn.close()
print("[warm] done.", flush=True)
