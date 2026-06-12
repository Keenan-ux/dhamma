// Heuristic Pali suffix stripper for query expansion. Mirrors
// src/paliStem.js on the client. Hand-coded suffix table — strips the
// most common Pali declensional and verbal endings to a stem we can use
// for tsquery prefix matching (stem:*).
//
// Endings ordered longest-first so multi-char suffixes are tried before
// single-char vowel strips. Imperfect by design — a proper lemmatizer
// (Digital Pali Dictionary lemmas) replaces this in a future pass.

const ENDINGS = [
  'ākarī', 'kārī', 'akari', 'ākari',
  'ññaṃ', 'ññā', 'ñña',
  'tabbo', 'tabbā', 'tabbaṃ',
  'mānā', 'māno', 'mānaṃ',
  'smiṃ', 'mhi',
  'ānaṃ', 'esu', 'ehi', 'āya', 'āyo', 'assa', 'āno', 'āni', 'ino',
  'aṃ', 'iṃ', 'uṃ',
  'o', 'ā', 'i', 'ī', 'u', 'ū', 'e', 'a',
];

const MIN_STEM_LENGTH = 3;

// The corpus (SuttaCentral bilara, CST) writes anusvara as ṁ (U+1E41);
// the ENDINGS table and most query input use ṃ (U+1E43). Normalize to ṃ
// so both word forms land in one shape before suffix stripping.
function normalizeAnusvara(s) {
  return s.replace(/ṁ/g, 'ṃ');
}

export function paliStem(word) {
  if (!word) return '';
  const w = normalizeAnusvara(String(word).toLowerCase());
  for (const e of ENDINGS) {
    if (w.length - e.length >= MIN_STEM_LENGTH && w.endsWith(e)) {
      return w.slice(0, -e.length);
    }
  }
  return w;
}

// Stem for use in tsquery prefix matching. Only returns a stem if it's
// long enough to be specific (avoids 'sat:*' matching half the corpus).
// Falls back to the original term when the stem would be too short.
const PREFIX_MIN_STEM = 4;

export function stemForPrefix(term) {
  if (!term) return term;
  const t = String(term).toLowerCase();
  if (t.length < PREFIX_MIN_STEM) return t;
  const stem = paliStem(t);
  if (stem.length >= PREFIX_MIN_STEM && stem !== t) return stem;
  return t;
}

// Diacritic folding for headword matching. `sampajāna` → `sampajana`,
// `anāthapiṇḍika` → `anathapindika`. Mirrors the SQL `translate()`
// expression on the `headword_folded` column so query and column fold
// the same way. Letting users type without diacritics still find the
// canonical entry.
const FOLD_FROM = 'āīūēōṃṁṅñṇṭḍḷḥṛśṣ';
const FOLD_TO   = 'aiueommnnntdlhrss';

export function foldDiacritics(s) {
  if (!s) return '';
  let out = '';
  for (const ch of String(s)) {
    const idx = FOLD_FROM.indexOf(ch);
    out += idx >= 0 ? FOLD_TO[idx] : ch;
  }
  return out;
}
