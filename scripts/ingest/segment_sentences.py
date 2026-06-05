"""Segment pass for the sentence-chunking re-embed (Phase 6 step 1).

Reads in-scope passages, runs the Pali-aware segmenter, and INSERTs one
row per sentence into passage_sentences with embedding=NULL. The GPU
embed pass (embed_sentences.py) then fills the embeddings. Cheap,
CPU/DB-bound, no GPU; can run before the GPU is warm.

Idempotent + resumable: INSERT ... ON CONFLICT (passage_id, field,
position) DO NOTHING, so a re-run skips rows already present. A passage
whose text changed would keep stale extra rows past its new sentence
count; for a clean re-segment of a passage, delete its rows first. For
the initial build this does not arise.

Scope (default 'mula'): the Tipitaka mula passages, where the
first-200-char snippet is weakest and sentence precision helps most. The
CST per-<p> commentary rows are already paragraph-sized, so they are out
of scope here (RE-EMBED-PLAN.md scope B).

Run from C:\\Dev\\Dhamma\\scripts\\ingest (proxy up, DATABASE_URL set):
    .venv/Scripts/python.exe segment_sentences.py --scope mula [--field original] [--limit N]
"""

import os
import sys
import argparse
import time

import psycopg2
import psycopg2.extras

from sentence_split import split_sentences

SCOPE_PREDICATE = {
    # Tipitaka mula across CST + SuttaCentral (work_role tags both).
    "mula": "p.work_role = 'mula'",
    # SuttaCentral bilara passages only.
    "sc": "p.source_edition = 'sc'",
    # Everything (full corpus, scope A) -- expensive; commentary is
    # already paragraph-sized so the marginal win is small.
    "all": "TRUE",
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--scope", choices=list(SCOPE_PREDICATE), default="mula")
    ap.add_argument("--field", choices=["original", "translation"], default="original",
                    help="Which passage text to segment. 'translation' uses the "
                         "primary (lowest-id) translations row per passage.")
    ap.add_argument("--limit", type=int, default=None, help="Cap passages processed (pilot).")
    ap.add_argument("--fetch", type=int, default=500)
    args = ap.parse_args()

    if not os.environ.get("DATABASE_URL"):
        print("DATABASE_URL not set", file=sys.stderr); sys.exit(1)

    conn = psycopg2.connect(
        os.environ["DATABASE_URL"],
        keepalives=1, keepalives_idle=30, keepalives_interval=10, keepalives_count=3,
    )
    conn.autocommit = False
    pred = SCOPE_PREDICATE[args.scope]

    # Source query: the text column depends on --field. For translation we
    # join the lowest-id translation row per passage (one per passage).
    if args.field == "original":
        text_sql = "p.original"
        join_sql = ""
        where_text = "p.original IS NOT NULL AND length(p.original) > 0"
    else:
        text_sql = "t.text"
        join_sql = ("JOIN LATERAL (SELECT text FROM translations tt "
                    "WHERE tt.passage_id = p.id AND tt.text IS NOT NULL "
                    "ORDER BY tt.id LIMIT 1) t ON TRUE")
        where_text = "TRUE"

    cur = conn.cursor()
    cur.execute(f"""
        SELECT COUNT(*) FROM passages p {join_sql}
         WHERE {pred} AND {where_text}
           AND NOT EXISTS (SELECT 1 FROM passage_sentences s
                            WHERE s.passage_id = p.id AND s.field = %s)
    """, (args.field,))
    pending = cur.fetchone()[0]
    print(f"[scope={args.scope} field={args.field}] passages pending segmentation: {pending}", flush=True)
    if pending == 0:
        print("[done] nothing to segment.", flush=True)
        conn.close(); return

    # Keyset pagination on a plain client cursor. A server-side named
    # cursor is invalidated by the periodic COMMIT of the insert batches
    # ("named cursor isn't valid anymore"); paginating by id > last_id
    # avoids that, advances past zero-sentence passages, and the NOT EXISTS
    # clause makes it resumable across runs.
    ins_cur = conn.cursor()
    fetch_cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    select_sql = f"""
        SELECT p.id AS id, {text_sql} AS txt
          FROM passages p {join_sql}
         WHERE {pred} AND {where_text}
           AND p.id > %s
           AND NOT EXISTS (SELECT 1 FROM passage_sentences s
                            WHERE s.passage_id = p.id AND s.field = %s)
         ORDER BY p.id
         LIMIT %s
    """
    t0 = time.time()
    passages_done = 0
    sentences_done = 0
    last_id = ""

    while True:
        if args.limit is not None and passages_done >= args.limit:
            break
        take = args.fetch
        if args.limit is not None:
            take = min(take, args.limit - passages_done)
        fetch_cur.execute(select_sql, (last_id, args.field, take))
        rows = fetch_cur.fetchall()
        if not rows:
            break
        batch_rows = []
        for row in rows:
            sents = split_sentences(row["txt"])
            for pos, sent in enumerate(sents):
                batch_rows.append((row["id"], pos, args.field, sent))
            sentences_done += len(sents)
            passages_done += 1
        last_id = rows[-1]["id"]
        if batch_rows:
            psycopg2.extras.execute_values(
                ins_cur,
                "INSERT INTO passage_sentences (passage_id, position, field, text) "
                "VALUES %s ON CONFLICT (passage_id, field, position) DO NOTHING",
                batch_rows, page_size=1000,
            )
        conn.commit()
        elapsed = time.time() - t0
        print(f"  {passages_done} passages, {sentences_done} sentences "
              f"({passages_done/max(elapsed,1):.0f} p/s, "
              f"avg {sentences_done/max(passages_done,1):.1f} sent/passage)", flush=True)

    wall = int(time.time() - t0)
    print(f"\n[segment] {passages_done} passages -> {sentences_done} sentence rows in {wall}s "
          f"(avg {sentences_done/max(passages_done,1):.1f} sentences/passage)", flush=True)
    conn.close()


if __name__ == "__main__":
    main()
