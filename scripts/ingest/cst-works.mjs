// CST filename → work metadata mapping.
//
// Each CST romn/ XML file resolves to a work_slug + citation_prefix + role.
// The well-known major works (4 nikāyas mūla, their commentaries, Vinaya,
// Abhidhamma, Visuddhimagga) have explicit entries with scholarly PTS/CPD
// abbreviations. Everything else falls through to one of three umbrellas
// (pli-commentary, pli-subcommentary, pli-anya) with auto-generated
// per-file work slugs so each supplementary work gets its own Browse entry.
//
// Roles map to passages.work_role:
//   'mula'  — canonical text (.mul.xml)
//   'attha' — commentary    (.att.xml)
//   'tika'  — sub-commentary (.tik.xml)
//   'anya'  — extra-canonical (.nrf.xml)
//
// Multi-volume works (e.g., Sumaṅgalavilāsinī ships as s0101a + s0102a +
// s0103a) all share the same work_slug — the volume distinction is
// preserved in xml_div_id and the passage citation locator.

// Explicit mapping for major works. Multiple file prefixes can share a
// work_slug (the volumes-of-one-work case). When no entry matches, the
// fallback in workForFile() routes by suffix to the right umbrella.
const EXPLICIT = [
  // ─────────────────── Sutta Piṭaka mūla (CST edition, parallel to SC) ───────────────────
  // Routes to the same pli-{dn,mn,sn,an} slugs as SC's mūla; the
  // source_edition column distinguishes them in queries.
  { match: /^s01\d\dm/,        role: 'mula',  slug: 'pli-dn', parent: 'pli-sutta',     citation: 'DN',  name: 'Dīgha Nikāya (CST)' },
  { match: /^s02\d\dm/,        role: 'mula',  slug: 'pli-mn', parent: 'pli-sutta',     citation: 'MN',  name: 'Majjhima Nikāya (CST)' },
  { match: /^s03\d\dm/,        role: 'mula',  slug: 'pli-sn', parent: 'pli-sutta',     citation: 'SN',  name: 'Saṃyutta Nikāya (CST)' },
  { match: /^s04\d\dm/,        role: 'mula',  slug: 'pli-an', parent: 'pli-sutta',     citation: 'AN',  name: 'Aṅguttara Nikāya (CST)' },

  // ─────────────────── DN commentary & sub-commentary ───────────────────
  { match: /^s01\d\da/,        role: 'attha', slug: 'pli-dn-attha', parent: 'pli-commentary',    citation: 'Sv-a',  name: 'Sumaṅgalavilāsinī' },
  { match: /^s01\d\dt/,        role: 'tika',  slug: 'pli-dn-tika',  parent: 'pli-subcommentary', citation: 'Sv-pṭ', name: 'Līnatthapakāsanā (DN ṭīkā)' },

  // ─────────────────── MN commentary & sub-commentary ───────────────────
  { match: /^s02\d\da/,        role: 'attha', slug: 'pli-mn-attha', parent: 'pli-commentary',    citation: 'Ps-a',  name: 'Papañcasūdanī' },
  { match: /^s02\d\dt/,        role: 'tika',  slug: 'pli-mn-tika',  parent: 'pli-subcommentary', citation: 'Ps-pṭ', name: 'Līnatthapakāsanā (MN ṭīkā)' },

  // ─────────────────── SN commentary & sub-commentary ───────────────────
  { match: /^s03\d\da/,        role: 'attha', slug: 'pli-sn-attha', parent: 'pli-commentary',    citation: 'Spk-a', name: 'Sāratthappakāsinī' },
  { match: /^s03\d\dt/,        role: 'tika',  slug: 'pli-sn-tika',  parent: 'pli-subcommentary', citation: 'Spk-pṭ',name: 'Līnatthapakāsanā (SN ṭīkā)' },

  // ─────────────────── AN commentary & sub-commentary ───────────────────
  { match: /^s04\d\da/,        role: 'attha', slug: 'pli-an-attha', parent: 'pli-commentary',    citation: 'Mp-a',  name: 'Manorathapūraṇī' },
  { match: /^s04\d\dt/,        role: 'tika',  slug: 'pli-an-tika',  parent: 'pli-subcommentary', citation: 'Mp-pṭ', name: 'Sāratthamañjūsā (AN ṭīkā)' },

  // ─────────────────── Khuddaka group (s05 + e0) — mūla goes under pli-kn ───────────────────
  // s05 files are Khuddaka mūla works. Each volume is a distinct sub-work,
  // but we route them all to pli-kn for now (matching SC's coarse-grained
  // pli-kn approach for some works). Citation prefix uses generic 'KN'
  // until per-work slugs land.
  { match: /^s05\d\dm/,        role: 'mula',  slug: 'pli-kn', parent: 'pli-sutta',     citation: 'KN',  name: 'Khuddaka Nikāya (CST)' },
  { match: /^s05\d\da/,        role: 'attha', slug: 'pli-kn-attha', parent: 'pli-commentary',    citation: 'KN-a', name: 'Khuddaka commentaries' },
  { match: /^s05\d\dt/,        role: 'tika',  slug: 'pli-kn-tika',  parent: 'pli-subcommentary', citation: 'KN-pṭ',name: 'Khuddaka sub-commentaries' },

  // ─────────────────── Vinaya Piṭaka ───────────────────
  { match: /^vin\d\dm/,        role: 'mula',  slug: 'pli-vinaya',       parent: 'pli-tipitaka',     citation: 'Vin', name: 'Vinaya Piṭaka (CST)' },
  { match: /^vin\d\da/,        role: 'attha', slug: 'pli-vin-attha',    parent: 'pli-commentary',   citation: 'Sp',  name: 'Samantapāsādikā' },
  { match: /^vin\d\dt/,        role: 'tika',  slug: 'pli-vin-tika',     parent: 'pli-subcommentary',citation: 'Sp-ṭ',name: 'Sāratthadīpanī (Vinaya ṭīkā)' },

  // ─────────────────── Abhidhamma Piṭaka ───────────────────
  { match: /^abh\d\dm/,        role: 'mula',  slug: 'pli-abhidhamma',     parent: 'pli-tipitaka',     citation: 'Abh',  name: 'Abhidhamma Piṭaka (CST)' },
  // Atthasālinī = Dhammasaṅgaṇī aṭṭhakathā (abh01a). Sammohavinodanī =
  // Vibhaṅga aṭṭhakathā (abh02a). Pañcappakaraṇa = the other 5 books'
  // commentary (abh03a). Group all three under pli-abh-attha umbrella;
  // citation prefix varies per file.
  { match: /^abh01a/,          role: 'attha', slug: 'pli-abh-attha',     parent: 'pli-commentary',   citation: 'As',     name: 'Atthasālinī' },
  { match: /^abh02a/,          role: 'attha', slug: 'pli-abh-attha',     parent: 'pli-commentary',   citation: 'Vibh-a', name: 'Sammohavinodanī' },
  { match: /^abh03a/,          role: 'attha', slug: 'pli-abh-attha',     parent: 'pli-commentary',   citation: 'Pañca-a',name: 'Pañcappakaraṇa-aṭṭhakathā' },
  { match: /^abh\d\dt/,        role: 'tika',  slug: 'pli-abh-tika',      parent: 'pli-subcommentary',citation: 'Abh-pṭ', name: 'Abhidhamma ṭīkā' },

  // ─────────────────── Visuddhimagga and related (e01) ───────────────────
  // Vism ships as 2 volumes (e0101n + e0102n); its sub-commentary
  // (Paramatthamañjūsā) ships as 2 volumes (e0103n + e0104n) with .att
  // suffix (CST's classification — categorically a ṭīkā in scholarly terms).
  // e0105n is a small supplementary work, routed by fallback.
  { match: /^e010[12]n/,       role: 'mula',  slug: 'pli-vism',        parent: 'pli-commentary',   citation: 'Vism',     name: 'Visuddhimagga' },
  { match: /^e010[34]n/,       role: 'tika',  slug: 'pli-vism-tika',   parent: 'pli-subcommentary',citation: 'Vism-mhṭ', name: 'Paramatthamañjūsā (Vism mahāṭīkā)' },
];

// Fallback parent_slug by role, when an unmatched file falls through.
const UMBRELLA = {
  mula:  'pli-tipitaka',
  attha: 'pli-commentary',
  tika:  'pli-subcommentary',
  anya:  'pli-anya',
};

// Suffix → role.
function roleFromSuffix(basename) {
  if (basename.endsWith('.mul')) return 'mula';
  if (basename.endsWith('.att')) return 'attha';
  if (basename.endsWith('.tik')) return 'tika';
  if (basename.endsWith('.nrf')) return 'anya';
  return null;
}

// Returns null if filename doesn't look like a CST file we want to ingest.
//
// Returned shape:
//   {
//     work_slug, work_name, parent_slug, citation_prefix, role,
//     is_umbrella: false,    // is this a per-file auto slug under an umbrella?
//   }
export function workForFile(filename) {
  // Normalize: strip directory and .xml suffix; expect e.g. "s0101a.att"
  const base = filename.replace(/\\/g, '/').split('/').pop().replace(/\.xml$/i, '');
  const matchKey = base.toLowerCase();

  for (const e of EXPLICIT) {
    if (e.match.test(matchKey)) {
      return {
        work_slug:       e.slug,
        work_name:       e.name,
        parent_slug:     e.parent,
        citation_prefix: e.citation,
        role:            e.role,
      };
    }
  }

  // Fallback: derive role from suffix, route under appropriate umbrella
  // with a per-file auto-generated work_slug. This gives every CST file
  // its own work entry in Browse — important for the ~80+ e-prefix and
  // vin-nrf files which are distinct historical texts (Mahāvaṃsa,
  // Dīpavaṃsa, etc.) that nobody will recognize behind a single umbrella.
  const role = roleFromSuffix(base);
  if (!role) return null;

  const stableSlug = `pli-cst-${base.replace(/\./g, '-').toLowerCase()}`;
  return {
    work_slug:       stableSlug,
    work_name:       base,                // overridden by parser using <p rend="book"> when available
    parent_slug:     UMBRELLA[role],
    citation_prefix: base.toUpperCase().replace(/\./g, '-'),
    role,
  };
}

// Compose passage id from CST file + a per-passage section locator.
// E.g., ('s0101a.att', 'dn1_1') → 'cst-s0101a.att-dn1_1'.
// E.g., ('abh01a.att', 23)     → 'cst-abh01a.att-023'.
export function passageId(baseFile, sectionLocator) {
  const baseName = baseFile.replace(/\.xml$/i, '');
  const locator = typeof sectionLocator === 'number'
    ? String(sectionLocator).padStart(3, '0')
    : String(sectionLocator);
  return `cst-${baseName}-${locator}`;
}

// Build the per-passage citation. Examples:
//   ('DN',   'dn1_5')        → 'DN 5'           (sutta nikāya: 2nd digit run is the canonical sutta number)
//   ('Sv-a', 'dn1_5')        → 'Sv-a 5'         (commentary keeps the same per-sutta locator)
//   ('Sv-a', 'dn1_0')        → 'Sv-a 1.intro'   (preamble subsection)
//   ('Sv-a', 'dn1')          → 'Sv-a vol.1'     (top-level volume wrapper)
//   ('Sv-a', 'dn1_5_p047')   → 'Sv-a 5 §47'     (paragraph row from fine mode)
//   ('Sv-a', 'dn1_0_p012')   → 'Sv-a 1.intro §12'
//   ('As',   23)             → 'As §23'         (flat-file counter)
//   ('Vism', 'chap1')        → 'Vism chap1'     (fallback)
export function formatCstCitation(prefix, sectionLocator) {
  if (typeof sectionLocator === 'number') {
    return `${prefix} §${sectionLocator}`;
  }
  const locator = String(sectionLocator);

  // Fine-mode paragraph row: ${parent}_p${NNN} format.
  //   - If parent is purely numeric (flat-mode section counter, like
  //     "23"), render as "${prefix} §23.5" — one § with dotted suffix.
  //   - Otherwise (div-nested locator like "dn1_5"), recurse to format
  //     the parent and append " §M".
  const para = locator.match(/^(.+)_p(\d+)$/);
  if (para) {
    const parentLocator = para[1];
    const paraNum = parseInt(para[2], 10);
    if (/^\d+$/.test(parentLocator)) {
      return `${prefix} §${parseInt(parentLocator, 10)}.${paraNum}`;
    }
    const parentCitation = formatCstCitation(prefix, parentLocator);
    return `${parentCitation} §${paraNum}`;
  }

  // Sutta-nikāya pattern: dn1_5, mn2_60, sn3_2 — first digit run is
  // volume, second digit run is the position-within-canon (sutta number
  // for DN/MN/AN; saṃyutta-or-vagga for SN). Match aligns with what SC
  // uses for its own ids.
  const sutta = locator.match(/^[a-z]+\d+_(\d+)$/);
  if (sutta) {
    const n = parseInt(sutta[1], 10);
    // _0 is the preamble (Ganthārambhakathā / nidāna), not sutta 0.
    if (n === 0) {
      const vol = locator.match(/^[a-z]+(\d+)_/)?.[1];
      return vol ? `${prefix} ${vol}.intro` : `${prefix} intro`;
    }
    return `${prefix} ${n}`;
  }

  // Top-level volume wrapper like "dn1" — usually a colophon. Show with
  // explicit "vol." so it doesn't collide with sutta numbering.
  const volWrapper = locator.match(/^[a-z]+(\d+)$/);
  if (volWrapper) {
    return `${prefix} vol.${volWrapper[1]}`;
  }

  // Anything else — dotted notation. Underscore is a structural
  // separator in CST ids; periods read more naturally to scholars.
  return `${prefix} ${locator.replace(/_/g, '.')}`;
}
