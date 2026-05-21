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

export async function runCorpus() {
  if (!sql) return { traditions: [] };

  // Run the tree query and the per-work passage list in parallel.
  const [rows, passageRows] = await Promise.all([
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
      ORDER BY work_slug, position NULLS LAST, id
    `,
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

  return { traditions: filtered };
}

export async function getPassage(id) {
  if (!sql || !id) return null;
  const [row] = await sql`
    SELECT id, work_slug, position, citation, title, canon,
           original_lang, original, translation, notes
    FROM passages WHERE id = ${id} LIMIT 1
  `;
  return row || null;
}

export async function getPassages(ids) {
  if (!sql || !ids || ids.length === 0) return [];
  const rows = await sql`
    SELECT id, work_slug, position, citation, title, canon,
           original_lang, original, translation, notes
    FROM passages WHERE id = ANY(${ids})
  `;
  const byId = new Map(rows.map((r) => [r.id, r]));
  return ids.map((i) => byId.get(i)).filter(Boolean);
}
