"""DPD gloss-injection helper for the BGE-M3 passage re-embed.

The whole DPD index (88K entries + 727K inflections) loads into RAM
once at startup so per-passage gloss build needs zero database round
trips. On my box this is ~120 MB and ~12 s to load.

Public API:

    db = GlossIndex(conn)
    db.load()                       # one-shot
    appendix, stats = db.gloss_for(text)

`appendix` is a single string like
"akkhāyī: one who relates, narrator; iddhi: psychic power; …"
ordered by first appearance of each headword in the source. `stats`
is a dict with token/headword/unmatched counts for the meta table.
"""

import os
import pickle
import re
import tempfile
import time
import psycopg2
import psycopg2.extras

# Bump when the on-disk pickle layout changes in a way that requires a
# rebuild (e.g. new fields, schema rework). The cache file embeds this
# tag so a stale pickle from an older code rev is silently ignored.
PICKLE_VERSION = 1

# Default cache path. Keep under scripts/ingest/.cache so a `git clean`
# doesn't nuke it but it stays out of the repo via .gitignore.
DEFAULT_CACHE_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), ".cache", "gloss_index.pkl"
)

# Punctuation we strip before tokenizing. Mirrors the JS probe so the
# Python-side token set matches what I checked at design time.
_TOKEN_PUNCT_RE = re.compile(r"[‘’“”\"().,;:!?\[\]<>{}–—]")
_WS_RE = re.compile(r"\s+")
# A token has to contain at least one Pāli or Latin letter to be worth
# looking up. Digits-only tokens (§§ section numbers, page numbers) are
# never in the dictionary.
_PALI_RE = re.compile(r"[a-zāīūṅñṭḍṇḷṃḥ]", re.IGNORECASE)

# Per-entry definition truncation. DPD p99 definition length is 90,
# max 242, so 200 chars almost never truncates a real definition. Cap
# is here to bound worst-case input length.
DEF_MAX = 200


def tokenize(text):
    """Yield lowercased Pāli-looking word tokens from text."""
    if not text:
        return []
    cleaned = _TOKEN_PUNCT_RE.sub(" ", text).lower()
    out = []
    for tok in _WS_RE.split(cleaned):
        if tok and _PALI_RE.search(tok):
            out.append(tok)
    return out


class GlossIndex:
    """In-memory DPD lookup. Two dicts: surface→[entry_ids],
    entry_id→(headword_lower, definition_first_chunk)."""

    def __init__(self, conn):
        self.conn = conn
        # surface_lower → tuple of entry_ids
        self.by_surface = {}
        # headword_lower → tuple of entry_ids (fallback for words not in inflections table)
        self.by_headword = {}
        # entry_id → (headword_lower, def_truncated)
        self.entries = {}
        self.loaded = False

    def load(self, cache_path=DEFAULT_CACHE_PATH, write_cache=True):
        """Populate the in-memory indexes.

        If `cache_path` is set and a valid pickle exists there, load
        from it (~5s). Otherwise pull from the DB (~30 min over the
        flyctl proxy) and, if `write_cache`, persist the result for
        next time. The pickle is atomic (write to temp + rename) so a
        kill mid-write can't leave a corrupt file behind."""
        if cache_path and self._try_load_cache(cache_path):
            self.loaded = True
            return

        cur = self.conn.cursor(name="dpd_load", cursor_factory=psycopg2.extras.DictCursor)
        cur.itersize = 20_000

        t0 = time.time()
        # Pull DPD entries
        cur.execute(
            "SELECT id, headword_lower, "
            "       LEFT(COALESCE(definition, ''), %s) AS def "
            "  FROM dictionary_entries "
            " WHERE source='dpd' AND headword_lower IS NOT NULL",
            (DEF_MAX,),
        )
        ent_count = 0
        for row in cur:
            eid = row["id"]
            hw = row["headword_lower"]
            df = (row["def"] or "").strip()
            self.entries[eid] = (hw, df)
            self.by_headword.setdefault(hw, []).append(eid)
            ent_count += 1
        cur.close()
        t1 = time.time()
        print(f"[dpd] loaded {ent_count} entries in {t1 - t0:.1f}s", flush=True)

        cur = self.conn.cursor(name="dpd_infl_load", cursor_factory=psycopg2.extras.DictCursor)
        cur.itersize = 50_000
        cur.execute(
            "SELECT i.surface_lower, i.entry_id "
            "  FROM dictionary_inflections i "
            "  JOIN dictionary_entries e ON e.id = i.entry_id AND e.source='dpd'"
        )
        infl_count = 0
        # Build with list-of-int aggregation then freeze to tuples to
        # shrink the dict footprint.
        tmp = {}
        for row in cur:
            tmp.setdefault(row["surface_lower"], []).append(row["entry_id"])
            infl_count += 1
        cur.close()
        self.by_surface = {k: tuple(v) for k, v in tmp.items()}
        # Same compaction on by_headword
        self.by_headword = {k: tuple(v) for k, v in self.by_headword.items()}
        t2 = time.time()
        print(f"[dpd] loaded {infl_count} inflection rows in {t2 - t1:.1f}s", flush=True)
        print(f"[dpd] surfaces={len(self.by_surface)} headwords={len(self.by_headword)} total={t2 - t0:.1f}s", flush=True)

        self.loaded = True

        if cache_path and write_cache:
            self._write_cache(cache_path)

    # ─────────────────── pickle cache ────────────────────

    def _try_load_cache(self, path):
        """Return True on successful load, False otherwise (so caller
        falls back to DB). Never raises — a bad cache is a soft miss."""
        try:
            if not os.path.exists(path):
                return False
            t0 = time.time()
            with open(path, "rb") as f:
                blob = pickle.load(f)
            if not isinstance(blob, dict) or blob.get("version") != PICKLE_VERSION:
                print(f"[dpd] cache version mismatch at {path}, ignoring", flush=True)
                return False
            self.by_surface = blob["by_surface"]
            self.by_headword = blob["by_headword"]
            self.entries = blob["entries"]
            dt = time.time() - t0
            print(
                f"[dpd] loaded from cache in {dt:.1f}s  "
                f"surfaces={len(self.by_surface)} headwords={len(self.by_headword)} entries={len(self.entries)}",
                flush=True,
            )
            return True
        except Exception as e:
            print(f"[dpd] cache load failed ({type(e).__name__}: {e}); will rebuild from DB", flush=True)
            return False

    def _write_cache(self, path):
        """Atomic write: pickle to a sibling temp file, then rename."""
        try:
            os.makedirs(os.path.dirname(path), exist_ok=True)
            blob = {
                "version": PICKLE_VERSION,
                "by_surface": self.by_surface,
                "by_headword": self.by_headword,
                "entries": self.entries,
            }
            t0 = time.time()
            # NamedTemporaryFile in the same dir so os.replace is atomic
            # on the same filesystem (Windows requires this).
            dirpath = os.path.dirname(path) or "."
            fd, tmp = tempfile.mkstemp(prefix=".gloss-cache-", suffix=".pkl.tmp", dir=dirpath)
            try:
                with os.fdopen(fd, "wb") as f:
                    pickle.dump(blob, f, protocol=pickle.HIGHEST_PROTOCOL)
                os.replace(tmp, path)
                size_mb = os.path.getsize(path) / (1024 * 1024)
                print(f"[dpd] cache written to {path} ({size_mb:.1f} MB, {time.time() - t0:.1f}s)", flush=True)
            except Exception:
                try: os.unlink(tmp)
                except OSError: pass
                raise
        except Exception as e:
            print(f"[dpd] cache write failed ({type(e).__name__}: {e}); continuing without cache", flush=True)

    def gloss_for(self, text):
        """Build the gloss appendix string + diagnostic stats."""
        assert self.loaded
        tokens = tokenize(text)
        if not tokens:
            return "", {"n_tokens": 0, "n_headwords": 0, "n_unmatched": 0}

        # Walk tokens in order; preserve first-appearance order for each
        # distinct headword. Per-token cache prevents re-lookup of
        # repeated words.
        seen_tokens = set()
        seen_headwords = set()
        ordered_entries = []
        unmatched = 0

        for tok in tokens:
            if tok in seen_tokens:
                continue
            seen_tokens.add(tok)

            eids = self.by_surface.get(tok)
            if not eids:
                eids = self.by_headword.get(tok)
            if not eids:
                unmatched += 1
                continue

            # Each token may resolve to multiple entries. We keep the
            # first one per headword to avoid blowing up gloss length
            # on homonym-rich words like "ka" or "so".
            for eid in eids:
                hw, df = self.entries[eid]
                if hw in seen_headwords:
                    continue
                seen_headwords.add(hw)
                ordered_entries.append((hw, df))
                # one entry per token is enough for embedding signal
                break

        parts = [f"{hw}: {df}" for hw, df in ordered_entries]
        appendix = "; ".join(parts)
        stats = {
            "n_tokens": len(seen_tokens),
            "n_headwords": len(seen_headwords),
            "n_unmatched": unmatched,
        }
        return appendix, stats


if __name__ == "__main__":
    # Tiny smoke test if you run this file directly.
    import os, sys
    if not os.environ.get("DATABASE_URL"):
        print("DATABASE_URL not set", file=sys.stderr); sys.exit(1)
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    idx = GlossIndex(conn)
    idx.load()
    sample = (
        "Paravajjānupassissāti imaṃ dhammadesanaṃ satthā jetavane viharanto "
        "ujjhānasaññiṃ nāma ekaṃ theraṃ ārabbha kathesi."
    )
    appendix, stats = idx.gloss_for(sample)
    print(f"\nstats: {stats}")
    print(f"appendix ({len(appendix)} chars):\n{appendix}")
    conn.close()
