import { useRef, useState } from 'react';
import { sanitizeDictHtml } from '../dictHtml.js';
import { highlightFind, withGlosses } from './highlight.jsx';
import { filterBodySegments } from './segments.js';

// Side-by-side parallel reader for passages that have both Pāli and an
// English translation. A draggable divider lets the reader weight one
// side over the other.
//
// When the passage has `segments` populated (SC bilara editorial
// segmentation), the reader renders one row per segment with Pāli on
// the left and English on the right, each row tagged with a
// data-segment attribute. This unlocks:
//   - simultaneous Pāli/English highlight on hover (sister-segment lookup)
//   - notes that anchor to a segment-range (rather than text offsets)
//
// When segments is null (CST commentary, library, non-SC), the reader
// falls back to two big single-string columns as before.
export default function SideBySideReader({
  passage,
  pali,
  english,
  englishIsHtml,
  findText,
  findStem,
  glossMap,
  noteRanges,
  selectedSeg,
}) {
  const [pct, setPct] = useState(50);
  const containerRef = useRef(null);
  const draggingRef = useRef(false);

  // Dual-highlight is now attached at the ReadingPanel root (covers
  // every reading path including the ATI-translator case where this
  // component still renders but with HTML on the English side).

  function onPointerDown(e) {
    draggingRef.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }
  function onPointerMove(e) {
    if (!draggingRef.current) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const next = (x / rect.width) * 100;
    setPct(Math.max(20, Math.min(80, next)));
  }
  function onPointerUp(e) {
    draggingRef.current = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }

  // Whether to render Pāli as segmented spans. We want this whenever
  // the passage carries segments, regardless of what the English side
  // renders as — that way the Pāli column always carries segment
  // markers + dual-highlight hover targets, even when the user is
  // reading with an ATI translator (English column = HTML blob).
  const hasTitle = !!(passage?.title || passage?.title_en);
  const hasSegments = !!passage?.segments;
  const keys = hasSegments ? filterBodySegments(passage.segments, hasTitle) : [];

  // Build each column independently so we can mix rendering modes:
  // Pāli always segmented when data exists, English segmented OR
  // HTML-blobbed depending on the active translator.
  const paliColumn = hasSegments && keys.length > 0 ? (
    <div style={readingOriginal}>
      {keys.map((k) => {
        const seg = passage.segments[k];
        if (!seg || !seg.pali) return null;
        const noted = segmentNoted(k, noteRanges);
        const cls = `dhamma-seg dhamma-seg-pali${noted ? ' dhamma-seg-noted' : ''}${k === selectedSeg ? ' dhamma-seg-active' : ''}`;
        return (
          <span
            key={k}
            className={cls}
            data-segment={k}
            data-passage-id={passage.id}
            style={segmentSpan}
          >
            {glossMap
              ? withGlosses(seg.pali, glossMap)
              : highlightFind(seg.pali, findText, findStem)}
            {' '}
          </span>
        );
      })}
    </div>
  ) : (
    <p style={readingOriginal}>
      {glossMap ? withGlosses(pali, glossMap) : highlightFind(pali, findText, findStem)}
    </p>
  );

  const englishColumn = englishIsHtml ? (
    // ATI translator → HTML blob. Dual-highlight on the Pāli side
    // still works for visual feedback even though there's no English
    // sister-element to highlight in turn.
    <div
      style={{ ...readingTranslation, marginBottom: 18 }}
      dangerouslySetInnerHTML={{ __html: sanitizeDictHtml(english) }}
    />
  ) : (hasSegments && keys.length > 0) ? (
    <div style={readingTranslation}>
      {keys.map((k) => {
        const seg = passage.segments[k];
        if (!seg || !seg.english) return null;
        const noted = segmentNoted(k, noteRanges);
        const cls = `dhamma-seg dhamma-seg-en${noted ? ' dhamma-seg-noted' : ''}${k === selectedSeg ? ' dhamma-seg-active' : ''}`;
        return (
          <span
            key={k}
            className={cls}
            data-segment={k}
            data-passage-id={passage.id}
            style={segmentSpan}
          >
            {highlightFind(seg.english, findText, findStem)}
            {' '}
          </span>
        );
      })}
    </div>
  ) : (
    <p style={{ ...readingTranslation, marginBottom: 18 }}>
      {highlightFind(english, findText, findStem)}
    </p>
  );

  return (
    <div ref={containerRef} style={sideBySideWrap}>
      <div style={{ ...sideBySidePane, flexBasis: `${pct}%` }}>
        {paliColumn}
      </div>
      <div
        style={sideBySideDivider}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        title="Drag to resize"
      >
        <div style={sideBySideGrip} />
      </div>
      <div style={{ ...sideBySidePane, flexBasis: `calc(${100 - pct}% - 18px)` }}>
        {englishColumn}
      </div>
    </div>
  );
}

const sideBySideWrap = {
  display: 'flex',
  alignItems: 'stretch',
  margin: '0 0 18px',
};

const sideBySidePane = {
  flex: '0 0 auto',
  minWidth: 0,
};

const sideBySideDivider = {
  flex: '0 0 18px',
  cursor: 'col-resize',
  display: 'flex',
  alignItems: 'stretch',
  justifyContent: 'center',
  touchAction: 'none',
};

const sideBySideGrip = {
  width: 2,
  alignSelf: 'stretch',
  background: 'rgba(var(--bc-accent-rgb), 0.18)',
  borderRadius: 1,
  transition: 'background 120ms ease',
};

const readingOriginal = {
  margin: '0 0 18px',
  fontFamily: '"Noto Serif", Georgia, serif',
  fontSize: 17,
  lineHeight: 1.85,
  color: 'var(--bc-text-primary)',
  userSelect: 'text',
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
  wordBreak: 'break-word',
};

const readingTranslation = {
  margin: 0,
  fontFamily: '"Noto Serif", Georgia, serif',
  fontSize: 15,
  lineHeight: 1.8,
  color: 'var(--bc-text-secondary)',
  userSelect: 'text',
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
  wordBreak: 'break-word',
};

// Per-segment span sits inline within the column so prose still
// reads as continuous paragraphs. The data attributes + class are
// what the dual-highlight and notes-anchor logic key off.
const segmentSpan = {
  // No display: inline override needed (default for span). The
  // class on the element drives the highlight CSS in theme.css.
};

// Numeric-aware compare on dotted segment keys. Inlined here so the
// noted-segment check doesn't need to import from segments.js.
function compareSegKeys(a, b) {
  const ap = a.split('.').map(Number);
  const bp = b.split('.').map(Number);
  const len = Math.max(ap.length, bp.length);
  for (let i = 0; i < len; i++) {
    const av = Number.isFinite(ap[i]) ? ap[i] : 0;
    const bv = Number.isFinite(bp[i]) ? bp[i] : 0;
    if (av !== bv) return av - bv;
  }
  return 0;
}

function segmentNoted(k, ranges) {
  if (!ranges || ranges.length === 0) return false;
  for (const r of ranges) {
    if (compareSegKeys(k, r.startKey) >= 0 && compareSegKeys(k, r.endKey) <= 0) return true;
  }
  return false;
}
