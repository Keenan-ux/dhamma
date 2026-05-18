// Heuristic Pali stem stripper. Catches common noun/adjective inflections so
// search for "sampajāna" matches "sampajāno", "sampajānakārī", etc. without
// requiring full morphological analysis. Real lemmatization ships with the
// Digital Pali Dictionary ingest in v2.
//
// Endings ordered longest-first so multi-char suffixes are tried before
// single-char vowel strips. Imperfect by design — a proper lemmatizer (or a
// rule-based Pali morphological analyzer) replaces this at corpus-ingest time.

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

export function paliStem(word) {
  if (!word) return '';
  let w = word.toLowerCase();
  for (const e of ENDINGS) {
    if (w.length - e.length >= MIN_STEM_LENGTH && w.endsWith(e)) {
      return w.slice(0, -e.length);
    }
  }
  return w;
}

const TOKEN_SPLIT = /[\s.,;:!?。、，；：！？「」"'()[\]{}]+/;

export function tokenize(text) {
  if (!text) return [];
  return text.split(TOKEN_SPLIT).filter(Boolean);
}

const MIN_OVERLAP = 4;

// Two stems are "related" if one contains the other (substring) — catches
// compounds where Pali smashes terms together (sātthaka-sampajaññaṃ, etc.).
function stemsRelated(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.length < MIN_OVERLAP || b.length < MIN_OVERLAP) return false;
  return a.includes(b) || b.includes(a);
}

// Cross-canon term aliases. Curated by hand for major Buddhist technical
// terms where Pali and Sanskrit / Pali and Pali-cognate forms diverge enough
// that surface-form stem stripping can't unify them. Real semantic search
// (v2) supersedes this; the alias map remains as a useful authority overlay
// for terms scholars treat as equivalent regardless of vector distance.
const ALIASES = new Map([
  ['sampajāna',     ['sampajañña', 'sampajānakārī', 'samprajāna', '正知']],
  ['sampajañña',    ['sampajāna', '正知']],
  ['sati',          ['smṛti', '念']],
  ['smṛti',         ['sati', '念']],
  ['satipaṭṭhāna',  ['smṛtyupasthāna', '念處', '念住']],
  ['vipassanā',     ['vipaśyanā', '觀']],
  ['paññā',         ['prajñā', '慧']],
  ['nibbāna',       ['nirvāṇa', '涅槃']],
  ['kamma',         ['karma', '業']],
  ['dhamma',        ['dharma', '法']],
  ['saṅgha',        ['saṃgha', '僧']],
  ['saṃsāra',       ['saṁsāra', '輪迴']],
  ['dukkha',        ['duḥkha', '苦']],
  ['anicca',        ['anitya', '無常']],
  ['anattā',        ['anātman', '無我']],
]);

function aliasFor(term) {
  return ALIASES.get(term.toLowerCase()) || [];
}

function singleMatch(haystack, needle) {
  const hayStems = tokenize(haystack).map(paliStem);
  const needleStems = tokenize(needle).map(paliStem);
  if (needleStems.length === 0) return false;
  return needleStems.every((ns) => hayStems.some((hs) => stemsRelated(ns, hs)));
}

// Match the full needle, then each known alias for it. Either path counts.
export function stemMatch(haystack, needle) {
  if (singleMatch(haystack, needle)) return true;
  const aliases = aliasFor(needle.trim());
  return aliases.some((a) => singleMatch(haystack, a));
}
