// Shared helpers for rendering passages segment-by-segment.
//
// SC bilara passages carry a segments JSONB column with shape:
//   { "1.1": { "pali": "…", "english": "…" }, "1.2": { … }, … }
// Segment keys correspond to SC's editorial sentence boundaries and
// match across the two languages (Pāli "1.3" == English "1.3").
//
// CST commentary and other non-segmented passages have segments=null;
// the reader degrades to rendering the joined original/translation
// strings as single blocks.

// Numeric-aware sort on dotted keys: "10.1" comes after "2.1",
// "1.10" comes after "1.2". Postgres JSONB preserves insertion order
// so the backfill already wrote keys in this order, but we re-sort on
// the client to be defensive.
export function sortSegmentKeys(keys) {
  return [...keys].sort((a, b) => {
    const ap = a.split('.').map(Number);
    const bp = b.split('.').map(Number);
    const len = Math.max(ap.length, bp.length);
    for (let i = 0; i < len; i++) {
      const av = Number.isFinite(ap[i]) ? ap[i] : 0;
      const bv = Number.isFinite(bp[i]) ? bp[i] : 0;
      if (av !== bv) return av - bv;
    }
    return 0;
  });
}

// Preamble segments (the :0.x block: collection name, vagga, sutta
// name) are now rendered in the page header via title / title_en, so
// repeating them in the body is redundant. Strip them out at render
// time when title metadata is populated.
export function filterBodySegments(segments, hasTitle) {
  if (!segments) return [];
  const keys = sortSegmentKeys(Object.keys(segments));
  if (!hasTitle) return keys;
  return keys.filter((k) => !/^0\./.test(k));
}

// Resolve a window selection Range to the segment ids at its start
// and end, by walking up the DOM to the nearest [data-segment]
// ancestor. Returns null if either endpoint isn't inside a segment
// element (e.g. selection in a non-segmented passage, or in the
// page chrome).
export function rangeToSegmentRange(range) {
  if (!range) return null;
  const startSeg = nearestSegment(range.startContainer);
  const endSeg = nearestSegment(range.endContainer);
  if (!startSeg || !endSeg) return null;
  const passageId = startSeg.getAttribute('data-passage-id');
  const otherPassageId = endSeg.getAttribute('data-passage-id');
  if (!passageId || passageId !== otherPassageId) return null;
  const startKey = startSeg.getAttribute('data-segment');
  const endKey = endSeg.getAttribute('data-segment');
  const [a, b] = sortSegmentKeys([startKey, endKey]);
  return { passageId, startKey: a, endKey: b };
}

function nearestSegment(node) {
  let n = node && node.nodeType === 1 ? node : node?.parentElement;
  while (n) {
    if (n.dataset && n.dataset.segment) return n;
    n = n.parentElement;
  }
  return null;
}
