// /api/corpus, /api/passage/:id, /api/compare execution. Pure DB reads
// shaped for the frontend.

import { sql } from './db.js';

export async function runCorpus() {
  if (!sql) return { traditions: [] };

  const rows = await sql`
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
      COALESCE(pc.cnt, 0) AS passage_count
    FROM traditions t
    LEFT JOIN works w ON w.tradition_slug = t.slug
    LEFT JOIN (
      SELECT work_slug, COUNT(*)::int AS cnt FROM passages GROUP BY work_slug
    ) pc ON pc.work_slug = w.slug
    ORDER BY t.display_order, w.display_order NULLS LAST, w.slug NULLS LAST
  `;

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

  function rollup(work) {
    let total = work.passage_count;
    for (const child of work.children) total += rollup(child);
    work.total_passage_count = total;
    return total;
  }
  for (const t of traditions.values()) {
    for (const w of t.works) rollup(w);
  }

  return { traditions: Array.from(traditions.values()) };
}

const PASSAGE_COLS = sql`id, work_slug, position, citation, title, canon, original_lang, original, translation, notes`;

export async function getPassage(id) {
  if (!sql || !id) return null;
  const [row] = await sql`SELECT ${PASSAGE_COLS} FROM passages WHERE id = ${id} LIMIT 1`;
  return row || null;
}

export async function getPassages(ids) {
  if (!sql || !ids || ids.length === 0) return [];
  const rows = await sql`SELECT ${PASSAGE_COLS} FROM passages WHERE id = ANY(${ids})`;
  const byId = new Map(rows.map((r) => [r.id, r]));
  return ids.map((i) => byId.get(i)).filter(Boolean);
}
