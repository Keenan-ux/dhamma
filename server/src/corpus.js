// /api/corpus, /api/passage/:id, /api/compare execution. Pure DB reads
// shaped for the frontend.

import { sql } from './db.js';

// CST mūla volume-header passages (e.g. cst-s0101m.mul-dn1, no
// underscore) are pos-1 placeholders carrying the uddāna mnemonic
// verse + closing colophon for an entire nikāya volume. Their content
// is redundant with the underscore-suffix sutta rows (cst-…-dn1_1,
// _2, …) where the actual canonical material lives. Hide them from
// /api/corpus so the browse tree shows real suttas only; the rows
// stay on disk and remain reachable via /api/passage/:id for any
// future use. See CLAUDE.md for the rationale.
const UDDANA_HEADER_REGEX = '^cst-[a-z0-9]+m\\.mul-(dn|mn|sn|an|kn)[0-9]+$';

// Per-tag_type facet rollup for faceted Browse filtering. Returns
//   { <tag_type>: [{ value, count }, …], … }
// where each type's values are ordered by descending passage count. The
// Browse chip-filter row is the primary consumer (it reads the `audience`
// list); the other ATI-derived types (simile / name / subject / number /
// title / author) ride along so any future faceted UI can use them without
// a second round-trip. Counts are passage_tags rows per (type, value) — one
// row per tagged passage, so the count is a passage count.
export async function getTagFacets() {
  if (!sql) return {};
  const rows = await sql`
    SELECT tag_type, tag_value, COUNT(*)::int AS count
    FROM passage_tags
    GROUP BY tag_type, tag_value
    ORDER BY tag_type, count DESC, tag_value
  `;
  const facets = {};
  for (const r of rows) {
    (facets[r.tag_type] ||= []).push({ value: r.tag_value, count: r.count });
  }
  return facets;
}

export async function runCorpus() {
  if (!sql) return { traditions: [], tagFacets: {} };

  // Run the tree query, the per-work passage list, and the tag facets in
  // parallel. tagFacets is a sibling key on the response — the `traditions`
  // tree shape is unchanged, so existing consumers (useCorpus reads only
  // `traditions`) are unaffected.
  const [rows, passageRows, tagFacets] = await Promise.all([
    sql`
      SELECT
        t.slug          AS tradition_slug,
        t.name          AS tradition_name,
        t.subtitle      AS tradition_subtitle,
        t.display_order AS tradition_order,
        w.slug,
        w.parent_slug,
        w.name,
        w.subtitle,
        w.is_stub,
        w.display_order,
        COALESCE(pc.cnt, 0)  AS passage_count,
        COALESCE(tc.cnt, 0)  AS translated_count
      FROM traditions t
      LEFT JOIN works w ON w.tradition_slug = t.slug
      LEFT JOIN (
        SELECT work_slug, COUNT(*)::int AS cnt
        FROM passages
        WHERE id !~ ${UDDANA_HEADER_REGEX}
        GROUP BY work_slug
      ) pc ON pc.work_slug = w.slug
      LEFT JOIN (
        -- Per-work count of passages that have at least one row in the
        -- translations table. Powers the Canon Map "Translated only"
        -- filter; rolled up through the tree on the server side.
        SELECT p.work_slug, COUNT(DISTINCT p.id)::int AS cnt
        FROM passages p
        JOIN translations tr ON tr.passage_id = p.id
        GROUP BY p.work_slug
      ) tc ON tc.work_slug = w.slug
      ORDER BY t.display_order, w.display_order NULLS LAST, w.slug NULLS LAST
    `,
    sql`
      SELECT id, citation, title, work_slug
      FROM passages
      WHERE id !~ ${UDDANA_HEADER_REGEX}
      ORDER BY work_slug,
               -- Group siblings of the same file/sutta together (strip
               -- the _pNNN paragraph suffix). For non-fine IDs this is
               -- a no-op so SC bilara passages fall through to position.
               COALESCE(regexp_replace(id, '_p[0-9]+$', ''), id) <> id,
               regexp_replace(regexp_replace(id, '_p[0-9]+$', ''), '_[0-9]+$', ''),
               -- Natural-numeric ordering on the sub-sutta number so
               -- dn1_2 sorts before dn1_10 (lexical would put _10 first).
               COALESCE((regexp_match(regexp_replace(id, '_p[0-9]+$', ''), '_([0-9]+)$'))[1]::int, 0),
               position NULLS LAST,
               id
    `,
    getTagFacets(),
  ]);

  const passagesByWork = new Map();
  for (const r of passageRows) {
    if (!passagesByWork.has(r.work_slug)) passagesByWork.set(r.work_slug, []);
    passagesByWork.get(r.work_slug).push({ id: r.id, citation: r.citation, title: r.title });
  }

  const traditions = new Map();
  const works = new Map();

  for (const r of rows) {
    if (!traditions.has(r.tradition_slug)) {
      traditions.set(r.tradition_slug, {
        slug: r.tradition_slug,
        name: r.tradition_name,
        subtitle: r.tradition_subtitle,
        works: [],
      });
    }
    if (r.slug) {
      works.set(r.slug, {
        slug: r.slug,
        name: r.name,
        subtitle: r.subtitle,
        is_stub: r.is_stub,
        passage_count: Number(r.passage_count) || 0,
        translated_count: Number(r.translated_count) || 0,
        children: [],
        parent_slug: r.parent_slug,
        tradition_slug: r.tradition_slug,
      });
    }
  }

  for (const w of works.values()) {
    if (w.parent_slug && works.has(w.parent_slug)) {
      works.get(w.parent_slug).children.push(w);
    } else {
      traditions.get(w.tradition_slug)?.works.push(w);
    }
  }

  // Attach passages to leaf works (no children). Rollup both passage and
  // translated counts so each interior node carries its subtree totals.
  function attach(work) {
    let total = work.passage_count;
    let translated = work.translated_count;
    if (work.children.length === 0) {
      work.passages = passagesByWork.get(work.slug) || [];
    } else {
      for (const child of work.children) {
        const sub = attach(child);
        total += sub.total;
        translated += sub.translated;
      }
    }
    work.total_passage_count = total;
    work.total_translated_count = translated;
    return { total, translated };
  }
  for (const t of traditions.values()) {
    for (const w of t.works) attach(w);
  }

  // Hide traditions that have zero actual passages anywhere in their
  // subtree. Mahāyāna and Zen are seeded in the schema as stubs (so the
  // tree CAN render them when real data lands) but they have no
  // canonical material ingested yet — surfacing empty branches read as
  // clutter on the UI side. Filter at the API boundary so the schema
  // stays intact for when those corpora come online.
  const filtered = Array.from(traditions.values()).filter((t) =>
    t.works.some((w) => (w.total_passage_count || 0) > 0)
  );

  return { traditions: filtered, tagFacets };
}

export async function getPassage(id) {
  if (!sql || !id) return null;
  const [row] = await sql`
    SELECT id, work_slug, position, citation, title, title_en, canon,
           original_lang, original, translation, notes, segments
    FROM passages WHERE id = ${id} LIMIT 1
  `;
  return row || null;
}

// ─────────────────── Sutta → commentary jump ───────────────────
//
// Given a canonical mūla sutta passage, return its CST Aṭṭhakathā
// (commentary) + Ṭīkā (sub-commentary) sections — the reader's
// "Commentary" section, mirroring the "Parallels" section.
//
// THE ALIGNMENT.  CST commentary rows carry a structural locator key
// embedded in their id, shared verbatim with the mūla edition:
//
//   mūla   cst-s0101m.mul-dn1_3      key = dn1_3  (DN vol.1, position 3)
//   attha  cst-s0101a.att-dn1_3_p047 key = dn1_3
//   tīkā   cst-s0101t.tik-dn1_3_p012 key = dn1_3
//
// The file prefix differs by ONE letter+suffix (m.mul → a.att / t.tik)
// and the volume number + locator key are identical across layers.
// The key's leading letters give the nikāya (dn/mn/sn/an/kn), which
// maps to the commentary work_slugs pli-{nik}-attha / pli-{nik}-tika.
// So commentary for a mūla key is:
//
//   work_slug IN (pli-{nik}-attha, pli-{nik}-tika)
//   AND <locator after file prefix> = key OR LIKE key || '_%'
//
// The fine (per-<p>) commentary rows number in the hundreds per
// section, so we collapse them to one entry per parent <div> (the
// `_pNNN` paragraph suffix stripped) and point at that section's first
// paragraph — the reader's group-fetch then expands it into the full
// continuous block, exactly like opening any other fine CST row.
//
// TWO MŪLA EDITIONS.
//   - CST mūla ids (cst-…m.mul-{key}) carry the key directly → exact.
//   - SuttaCentral mūla ids (dn1, mn10, dn22) use global sutta numbers
//     with no locator key. We bridge them to their CST mūla sibling in
//     the same work_slug by normalised title match (strip a leading
//     "N. ", fold diacritics, drop the trailing anusvāra/-ṃ that
//     distinguishes CST's "Brahmajālasuttaṃ" from SC's
//     "Brahmajālasutta"), then follow that sibling's key.
//
// MN/SN/AN — THE TITLE-BRIDGE FALLBACK.
//   The key-bridge above fails for SC per-sutta ids in MN/SN/AN because
//   their commentary is NOT keyed per-sutta. The whole Papañcasūdanī
//   vol.1 lives under ONE locator (`mn1_1`); each per-sutta commentary
//   block is distinguished only by its <div>'s TITLE, of the form
//
//     "10. Satipaṭṭhānasuttavaṇṇanā"        (MN, AN — per sutta)
//     "1-2. Avijjāsuttādivaṇṇanā"           (SN peyyāla group: "…etc.")
//
//   The CST mūla rows for those nikāyas are vagga-level, so the SC sutta
//   ("Satipaṭṭhānasutta") has no per-sutta CST mūla title twin and the
//   key-bridge returns nothing. We then fall back to matching commentary
//   rows in pli-{nik}-attha / pli-{nik}-tika whose normalised title
//   STARTS WITH the sutta's normalised title and ENDS in "vaṇṇanā" — the
//   sutta's own commentary heading. Including the sutta name's "sutta"
//   token in the prefix anchors the match: "satipaṭṭhānasutta" won't
//   prefix-match an unrelated "satipaṭṭhānakathāvaṇṇanā", but DOES catch
//   SN's grouped "…suttādivaṇṇanā". We group by (parent_div, normalised
//   title) — one entry per physical commentary SECTION, pointing at its
//   lowest-ordinal paragraph (the section's first <p>, which the reader's
//   group-fetch expands forward into the whole block).
//
// LIMITATIONS (documented for the UI + callers):
//   - DN commentary is per-sutta, so DN suttas (CST or SC ids) resolve
//     to that sutta's own Sv-a + Sv-pṭ section via the key-bridge. The SC
//     title-bridge is 100% on DN's 34 suttas (verified, no collisions).
//   - MN/AN: the per-sutta title-bridge resolves SC ids (mn10, an3.61)
//     to that sutta's own Ps-a / Mp-a (+ -pṭ) heading. A handful of
//     suttas whose CST aṭṭhakathā is folded into a neighbour's heading
//     (e.g. mn152 has a ṭīkā heading but no standalone aṭṭhakathā one)
//     resolve their ṭīkā only — partial coverage, not empty.
//   - SN reuses sutta names across saṃyuttas (several "Ādittasutta"s,
//     "Avijjāsutta"s, …). The SC id alone can't disambiguate which
//     saṃyutta by title, so for those the title-bridge returns ALL
//     matching commentary headings (one per saṃyutta) rather than
//     guessing one — the scholar picks. Unique SN names resolve cleanly.
//   - Vism/Vinaya/Abhidhamma mūla aren't in the sutta nikāyas, so they
//     return [] here (their commentary lives under different slugs with
//     a different alignment and isn't a sutta→commentary jump).
//   - Passages that are themselves commentary/sub-commentary/anya, or
//     have no resolvable mūla key/title, return empty arrays (not error).

const SUTTA_NIKAYA_SLUGS = new Set(['pli-dn', 'pli-mn', 'pli-sn', 'pli-an', 'pli-kn']);

// Pull the (nikāya, key) from a CST mūla id's locator. The key is the
// full structural locator (dn1_3); the nikāya is its leading letters.
function keyFromCstMula(id) {
  const m = id.match(/^cst-s\d+[mat]\.(?:mul|att|tik)-(.+)$/);
  if (!m) return null;
  // Drop any paragraph suffix so an SC-reader landing on a fine row
  // still resolves to the section key. Mūla rows are coarse (no _pNNN)
  // but be defensive.
  const key = m[1].replace(/_p\d+$/, '');
  const nik = (key.match(/^([a-z]+)\d/) || [])[1] || null;
  return nik ? { nik, key } : null;
}

// Split a flat list of CST commentary rows (each carrying work_role
// 'attha' | 'tika') into the reader's { attha, tika } layer arrays,
// capped at perLayer. Shared by the key-bridge and the title-bridge so
// both emit the identical entry shape the reader already renders.
function splitCommentaryLayers(rows, id, perLayer) {
  const layerEntry = (r) => ({
    id: r.id,
    citation: r.citation,
    title: r.title,
    work_slug: r.work_slug,
    layer: r.work_role,            // 'attha' | 'tika'
    snippet: r.snippet || null,
  });
  const attha = [];
  const tika = [];
  for (const r of rows) {
    if (r.work_role === 'tika') tika.push(layerEntry(r));
    else attha.push(layerEntry(r));
  }
  return {
    passage_id: id,
    attha: attha.slice(0, perLayer),
    tika: tika.slice(0, perLayer),
  };
}

export async function getCommentaryFor(id, { perLayer = 60 } = {}) {
  const empty = { passage_id: id, attha: [], tika: [] };
  if (!sql || !id) return empty;

  const mula = await getPassage(id);
  if (!mula) return empty;

  // Only canonical sutta-nikāya mūla rows get a sutta→commentary jump.
  // Commentary / sub-commentary / extra-canonical rows return empty so
  // the section never shows while already reading commentary.
  if (!SUTTA_NIKAYA_SLUGS.has(mula.work_slug)) return empty;

  // Resolve the structural locator key + nikāya.
  let resolved = null;
  if (id.startsWith('cst-')) {
    resolved = keyFromCstMula(id);
  } else {
    // SuttaCentral mūla id — bridge to the CST mūla sibling in the same
    // work_slug by normalised title, then take its key. Normalisation
    // (lower, fold diacritics, strip leading "N. ", drop trailing -ṃ)
    // is applied symmetrically to both titles in SQL so we compare like
    // for like. LIMIT 1: DN's 34 suttas are collision-free under this
    // normalisation; if a future nikāya ever collides we take the first
    // deterministically rather than fanning out.
    const [sib] = await sql`
      WITH norm AS (
        SELECT id,
               regexp_replace(
                 translate(
                   lower(regexp_replace(coalesce(title, ''), '^\\s*[0-9]+\\.?\\s*', '')),
                   'āīūēōṃṁṅñṇṭḍḷḥ', 'aiueommnnntdlh'
                 ),
                 'm+$', ''
               ) AS k
        FROM passages
        WHERE source_edition = 'cst' AND work_role = 'mula'
          AND work_slug = ${mula.work_slug}
      ),
      target AS (
        SELECT regexp_replace(
                 translate(
                   lower(regexp_replace(${mula.title || ''}, '^\\s*[0-9]+\\.?\\s*', '')),
                   'āīūēōṃṁṅñṇṭḍḷḥ', 'aiueommnnntdlh'
                 ),
                 'm+$', ''
               ) AS k
      )
      SELECT n.id
      FROM norm n, target t
      WHERE n.k = t.k AND length(t.k) > 0
      LIMIT 1
    `;
    if (sib?.id) resolved = keyFromCstMula(sib.id);
  }

  // ── Key-bridge: locator-equality match (DN, any CST mūla id) ──
  if (resolved) {
    const { nik, key } = resolved;
    const atthaSlug = `pli-${nik}-attha`;
    const tikaSlug  = `pli-${nik}-tika`;
    // LIKE pattern: rows whose locator equals the key OR begins with
    // `key_` (sub-sections + paragraph rows). The literal `_` after the
    // key is what keeps `dn1_1` from matching `dn1_10`. `\` is the LIKE
    // escape so the `_`s in the key are treated literally.
    const keyLike = key.replace(/([\\%_])/g, '\\$1') + '\\_%';

    // One row per parent <div> (paragraph suffix stripped), pointing at
    // that section's lowest-ordinal paragraph — the natural entry point
    // the reader's group-fetch will expand. DISTINCT ON keeps the row
    // count proportional to commentary SECTIONS, not paragraphs.
    const rows = await sql`
      SELECT DISTINCT ON (parent_div)
        id, citation, title, work_slug, work_role,
        LEFT(regexp_replace(coalesce(original, ''), '\\s+', ' ', 'g'), 220) AS snippet
      FROM (
        SELECT id, citation, title, work_slug, work_role, original,
               regexp_replace(id, '_p[0-9]+$', '') AS parent_div,
               regexp_replace(id, '^cst-s[0-9]+[mat]\\.(mul|att|tik)-', '') AS locator,
               coalesce((regexp_match(id, '_p([0-9]+)$'))[1]::int, 0) AS para_ord
        FROM passages
        WHERE work_slug IN (${atthaSlug}, ${tikaSlug})
      ) c
      WHERE c.locator = ${key} OR c.locator LIKE ${keyLike} ESCAPE '\\'
      ORDER BY parent_div, para_ord
    `;
    if (rows.length > 0) return splitCommentaryLayers(rows, id, perLayer);
    // The key resolved but no commentary rows carry it — fall through to
    // the title-bridge below before giving up.
  }

  // ── Title-bridge fallback: per-sutta heading match (MN/SN/AN SC ids) ──
  //
  // Only SuttaCentral mūla ids reach here without a key-bridge hit. The
  // nikāya comes from the SC id's leading letters (mn10→mn, sn12.1→sn,
  // an3.61→an). DN/KN SC ids already resolved via the key-bridge; if one
  // ever fell through, this same heading match applies harmlessly.
  const nik = (id.match(/^([a-z]+)\d/) || [])[1];
  if (!nik) return empty;
  const atthaSlug = `pli-${nik}-attha`;
  const tikaSlug  = `pli-${nik}-tika`;

  // Match commentary <div> headings whose normalised title starts with
  // the sutta's normalised title and ends in "vaṇṇanā". Normalisation
  // mirrors the key-bridge's CST-mūla bridge (lower, strip a leading
  // "N." / "N-M." ordinal, fold diacritics, drop trailing -ṃ) so the SC
  // sutta title "Satipaṭṭhānasutta" lines up with the commentary heading
  // "10. Satipaṭṭhānasuttavaṇṇanā". DISTINCT ON (parent_div, title_norm)
  // keeps one entry per physical commentary SECTION (so SN's repeated
  // names across saṃyuttas all survive), each pointing at the section's
  // lowest-ordinal paragraph. The folded `title_norm`/`k` are ASCII
  // letters only (the translate() collapses diacritics), so they carry
  // no LIKE metacharacters — the `t.k || '%'` prefix match is literal.
  const titleRows = await sql`
    SELECT DISTINCT ON (parent_div, title_norm)
      id, citation, title, work_slug, work_role,
      LEFT(regexp_replace(coalesce(original, ''), '\\s+', ' ', 'g'), 220) AS snippet
    FROM (
      SELECT id, citation, title, work_slug, work_role, original,
             regexp_replace(id, '_p[0-9]+$', '') AS parent_div,
             coalesce((regexp_match(id, '_p([0-9]+)$'))[1]::int, 0) AS para_ord,
             regexp_replace(
               translate(
                 lower(regexp_replace(coalesce(title, ''), '^\\s*[0-9]+(-[0-9]+)?\\.?\\s*', '')),
                 'āīūēōṃṁṅñṇṭḍḷḥ', 'aiueommnnntdlh'
               ),
               'm+$', ''
             ) AS title_norm
      FROM passages
      WHERE work_slug IN (${atthaSlug}, ${tikaSlug})
    ) c,
    (
      SELECT regexp_replace(
               translate(
                 lower(regexp_replace(${mula.title || ''}, '^\\s*[0-9]+(-[0-9]+)?\\.?\\s*', '')),
                 'āīūēōṃṁṅñṇṭḍḷḥ', 'aiueommnnntdlh'
               ),
               'm+$', ''
             ) AS k
    ) t
    WHERE length(t.k) > 0
      AND c.title_norm LIKE t.k || '%'
      AND c.title_norm LIKE '%vannana'
    ORDER BY parent_div, title_norm, para_ord
  `;
  if (titleRows.length > 0) return splitCommentaryLayers(titleRows, id, perLayer);

  return empty;
}

export async function getPassages(ids) {
  if (!sql || !ids || ids.length === 0) return [];
  const rows = await sql`
    SELECT id, work_slug, position, citation, title, title_en, canon,
           original_lang, original, translation, notes, segments
    FROM passages WHERE id = ANY(${ids})
  `;
  const byId = new Map(rows.map((r) => [r.id, r]));
  return ids.map((i) => byId.get(i)).filter(Boolean);
}

// Group + translations fetch. Returns each row's translations
// indexed by passage_id, for the same group the /group endpoint
// would return. Used by the reader's multi-translator dropdown
// when the view is a merged paragraph group: instead of showing
// only the anchor row's translators, we surface any translator
// present on ANY group row, then concatenate their per-row text in
// source order when the user selects them.
//
// Returned shape: { anchor: passageId, translations: [{ passage_id,
// translator, source, text, license, source_book, source_url }] }
// — rows ordered by group order so the consumer can groupBy
// translator and join in sequence.
export async function getPassageGroupTranslations(id) {
  if (!sql || !id) return null;
  const groupResult = await getPassageGroup(id);
  if (!groupResult || !groupResult.group) return null;
  const ids = groupResult.group.map((r) => r.id);
  // Preserve group order via a positional join.
  const trans = await sql`
    SELECT t.passage_id, t.translator, t.source, t.text, t.license,
           t.source_book, t.source_url,
           array_position(${ids}::text[], t.passage_id) AS pos
    FROM translations t
    WHERE t.passage_id = ANY(${ids})
    ORDER BY array_position(${ids}::text[], t.passage_id), t.translator
  `;
  return { anchor: id, translations: trans };
}

// Paragraph-group fetch. Returns the requested passage plus its
// sibling paragraph rows (same parent div) so the reader can render
// the whole logical "page" at once instead of one paragraph at a time.
//
// Group identity for a fine paragraph row `cst-{file}-{div}_p{NNN}`
// is the prefix `cst-{file}-{div}` — everything before `_p\d+$`.
// Rows without a `_p\d+$` suffix are singleton groups (canonical mula,
// extra-canonical, Vism mula etc. — already monolithic).
//
// Returned shape: { anchor: passageId, group: [row, …] } where the
// rows are ordered by their paragraph-suffix integer (position-aware
// for fine rows; for singleton groups the group array has one entry).
export async function getPassageGroup(id) {
  if (!sql || !id) return null;
  const m = id.match(/^(.+)_p\d+$/);
  if (!m) {
    // Singleton group — just return the single row.
    const row = await getPassage(id);
    if (!row) return null;
    return { anchor: id, group: [row] };
  }
  const prefix = m[1];
  const likePattern = prefix + '\\_p%';
  // Postgres LIKE: `_` is a single-char wildcard, so we escape it as `\_`
  // and pass `ESCAPE '\'` to keep the regexp_match ordering deterministic.
  // ORDER BY the integer paragraph suffix so display order matches the
  // CST source order, not alphabetical (otherwise _p10 sorts before _p2).
  const rows = await sql`
    SELECT id, work_slug, position, citation, title, title_en, canon,
           original_lang, original, translation, notes, segments
    FROM passages
    WHERE id LIKE ${likePattern} ESCAPE '\\'
    ORDER BY (regexp_match(id, '_p([0-9]+)$'))[1]::int
  `;
  if (rows.length === 0) {
    // Anchor row exists but no siblings under the LIKE prefix —
    // fall back to singleton group with the anchor only.
    const row = await getPassage(id);
    if (!row) return null;
    return { anchor: id, group: [row] };
  }
  return { anchor: id, group: rows };
}
