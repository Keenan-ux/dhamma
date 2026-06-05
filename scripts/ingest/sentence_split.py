"""Pali-aware sentence segmenter for the sentence-chunking re-embed.

Pure function, no model. Splits a passage's text into sentence units for
the passage_sentences table. Designed for the corpus's scripts (Latin
transliteration is the bulk; Devanagari danda and CJK terminators are
handled for the few sources that use them).

The hard cases (per RE-EMBED-PLAN.md):
  - Pali peyyala abbreviations: "pe." / "la." and the ...pe... ellipsis
    must NOT end a sentence.
  - Numbered list / section markers ("1." "2.") are not sentence ends.
  - Verse (gatha) is line-broken, not sentence-punctuated; with no
    internal terminator it stays one unit (we collapse newlines first).
  - Digit-only / punctuation-only fragments are dropped (or merged).
  - Fragments shorter than a floor are merged into their neighbor so a
    stray short clause does not become its own vector.

Public API:
    split_sentences(text) -> list[str]

Run directly to execute the self-test on known-hard passages.
"""

import re

# Sentence terminators across the corpus's scripts: Latin ., !, ?, the
# Devanagari danda U+0964 and double-danda U+0965, and CJK full stop /
# bang / question (a handful of Chinese-parallel rows).
_TERMINATORS = ".!?।॥。！？"
_SPLIT_RE = re.compile("([" + re.escape(_TERMINATORS) + "])")

# Words that take a trailing period but do not end a sentence. Pali
# peyyala ("and so on") is "pe"; "la" is the other common contraction.
_ABBR = {"pe", "la"}

# A fragment must contain at least one Pali/Latin letter to be a real
# sentence; digit-only or punctuation-only fragments (section numbers,
# uddana markers) are not. Mirrors gloss_inject.tokenize's letter test.
_HAS_LETTER = re.compile(r"[a-zA-Zāīūṅñṭḍṇḷṃṁḥ]")

# Merge a sentence shorter than this (after trim) into the previous one.
_MIN_LEN = 15


def split_sentences(text):
    if not text:
        return []
    # Collapse all whitespace (verse line breaks included) to single
    # spaces so a verse with no internal terminator reads as one unit and
    # a prose sentence broken across lines is rejoined.
    s = re.sub(r"\s+", " ", str(text)).strip()
    if not s:
        return []

    parts = _SPLIT_RE.split(s)  # [chunk, term, chunk, term, ..., chunk]
    raw = []
    buf = ""
    i = 0
    while i < len(parts):
        chunk = parts[i]
        term = parts[i + 1] if i + 1 < len(parts) else ""
        buf += chunk + term
        # Last whitespace-delimited token of this chunk, minus trailing
        # ellipsis/period, lowered. Used to suppress abbreviation and
        # numbered-marker splits.
        m = re.search(r"(\S+)\s*$", chunk)
        last = m.group(1).strip(".…").lower() if m else ""
        is_abbr = last in _ABBR
        is_number = last.isdigit()
        ends = bool(term) and term in _TERMINATORS and not is_abbr and not is_number
        if ends:
            raw.append(buf.strip())
            buf = ""
        i += 2
    if buf.strip():
        raw.append(buf.strip())

    out = []
    for frag in raw:
        f = frag.strip()
        if not f:
            continue
        if not _HAS_LETTER.search(f):
            # digits / punctuation only: glue to the previous sentence so
            # a leading section number stays with its sentence, else drop.
            if out:
                out[-1] = (out[-1] + " " + f).strip()
            continue
        if len(f) < _MIN_LEN and out:
            out[-1] = (out[-1] + " " + f).strip()
        else:
            out.append(f)
    return out


if __name__ == "__main__":
    import sys
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
    cases = [
        ("two prose sentences",
         "Evaṃ me sutaṃ ekaṃ samayaṃ bhagavā sāvatthiyaṃ viharati. "
         "Tatra kho bhagavā bhikkhū āmantesi.",
         2),
        ("peyyala ellipsis stays one",
         "Idha bhikkhu kāye kāyānupassī viharati …pe… sabbe dhammā anattāti.",
         1),
        ("pe. abbreviation does not split",
         "Cattāro satipaṭṭhānā pe. ariyo aṭṭhaṅgiko maggo.",
         1),
        ("numbered markers do not shatter",
         "1. Paṭhamaṃ jhānaṃ. 2. Dutiyaṃ jhānaṃ.",
         2),
        ("verse with no terminator is one unit",
         "Manopubbaṅgamā dhammā\nmanoseṭṭhā manomayā\nmanasā ce paduṭṭhena",
         1),
        ("question + statement",
         "Katamo ca, bhikkhave, maggo? Ayameva ariyo aṭṭhaṅgiko maggo.",
         2),
    ]
    ok = True
    for name, text, expect in cases:
        got = split_sentences(text)
        status = "ok " if len(got) == expect else "FAIL"
        if len(got) != expect:
            ok = False
        print(f"[{status}] {name}: expected {expect}, got {len(got)}")
        for j, sent in enumerate(got):
            print(f"        {j}: {sent}")
    print("\nALL PASS" if ok else "\nSOME FAILED")
