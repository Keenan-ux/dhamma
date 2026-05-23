// Paragraph-grouped navigation for fine-grained CST commentary rows.
//
// After the 2026-05 per-<p> subdivision (HANDOFF tasks #9, #10, #13),
// the att+tik corpus has roughly 5-30x more rows than before. A
// typical sutta-commentary now has 100-1500 paragraph rows where
// previously it had 1. Prev/next navigation that jumps row-by-row
// would be unusable — the scholar would click hundreds of times to
// traverse one sutta-commentary.
//
// The fix is to group consecutive paragraph rows that share the same
// parent xml_div_id into a "page" for display purposes. Internally
// each paragraph stays its own row (search precision and translation-
// alignment depend on that), but the reader navigates by group:
//
//   - When the reader opens a passage with xml_div_id=X, it shows ALL
//     rows whose xml_div_id=X, concatenated in source order.
//   - Prev jumps to the LAST row of the previous xml_div_id group.
//   - Next jumps to the FIRST row of the next xml_div_id group.
//   - A passage with no xml_div_id (mula, anya, library articles) is
//     its own group of size 1 — same behaviour as before.
//
// This file exports the pure functions BrowseView wires up to its
// existing leaf list. The render-side changes live in ReadingPanel
// (fetches grouped passages on open) and Dhamma.jsx (route handler
// resolves group identity before passing to ReadingPanel).

// Stable group key for a passage. Fine CST rows carry xml_div_id —
// that's the natural group. Everything else groups by its own id.
// Returns a string the caller can use as a Map key.
export function groupKey(passage) {
  if (!passage) return null;
  // Fine paragraph rows: id is like "cst-{file}-{div}_p{NNN}".
  // The xml_div_id stored on the row is `{div}` (no _p suffix), so
  // siblings within the same parent div share that value.
  if (passage.xml_div_id) {
    // Combine the work file basename with the div id so groups
    // from different files don't collide (e.g. dn1_1 in s0101a vs
    // dn1_1 elsewhere). Reuse the id's prefix up to the last `-`.
    const dashIdx = passage.id ? passage.id.lastIndexOf('-') : -1;
    const fileTag = dashIdx > 0 ? passage.id.slice(0, dashIdx) : '';
    return `${fileTag}::${passage.xml_div_id}`;
  }
  return `solo::${passage.id || ''}`;
}

// Given an ordered list of leaves (from collectLeaves), produce the
// sequence of groups in the same order. Each group is an array of
// leaves sharing the same groupKey, in source order. Solo leaves
// (no xml_div_id) become singleton groups.
//
// Optimisation: we don't need to read passage.xml_div_id at this
// point because the leaf nodes are tree-derived and only carry
// passageId — not the full passage payload. The grouping by xml_div_id
// happens server-side or post-fetch. For corpus-tree-only navigation
// the grouping reduces to "consecutive leaves whose ids share the
// `_p` paragraph-suffix prefix".
//
// A leaf id has the shape `cst-{file}-{div}_p{NNN}` for fine rows.
// We extract everything before `_p{NNN}` to form the group key. For
// non-fine ids (no `_p` suffix), the leaf is its own group.

// Strip the trailing `_p{NNN}` (zero-padded paragraph counter) from a
// fine row id to expose its group identity. Returns null if no
// paragraph suffix present (the row is a solo group).
export function paragraphGroupId(rowId) {
  if (!rowId) return null;
  const m = rowId.match(/^(.+)_p\d+$/);
  return m ? m[1] : null;
}

// Group an ordered leaf-list (corpus-tree leaves with .passageId or
// .id) into an ordered list of groups. Each entry is either a single
// leaf (solo) or an array of leaves sharing a paragraphGroupId.
export function groupLeaves(leaves) {
  const groups = [];
  let current = null;        // { key, items }
  for (const leaf of leaves || []) {
    const id = leaf.passageId || leaf.id;
    const gid = paragraphGroupId(id);
    if (gid === null) {
      if (current) { groups.push(current); current = null; }
      groups.push({ key: `solo::${id}`, items: [leaf], solo: true });
      continue;
    }
    if (current && current.key === gid) {
      current.items.push(leaf);
    } else {
      if (current) groups.push(current);
      current = { key: gid, items: [leaf], solo: false };
    }
  }
  if (current) groups.push(current);
  return groups;
}

// Find the group containing a given leaf id, plus the prev/next
// groups for navigation. Returns { group, groupIndex, prevGroup,
// nextGroup } or null if not found.
export function findGroupContext(groups, leafId) {
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    if (g.items.some((leaf) => (leaf.passageId || leaf.id) === leafId)) {
      return {
        group: g,
        groupIndex: i,
        prevGroup: i > 0 ? groups[i - 1] : null,
        nextGroup: i < groups.length - 1 ? groups[i + 1] : null,
      };
    }
  }
  return null;
}

// For a given group, return the leaf id the reader should open when
// the user navigates "to this group". By convention this is the FIRST
// leaf of the group (so the reader scrolls to the top of the
// commentary section, not the middle).
export function groupAnchorLeafId(group) {
  if (!group || !group.items || group.items.length === 0) return null;
  const first = group.items[0];
  return first.passageId || first.id;
}
