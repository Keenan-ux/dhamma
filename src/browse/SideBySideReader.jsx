import { useRef, useState } from 'react';
import { sanitizeDictHtml } from '../dictHtml.js';
import { highlightFind, withGlosses } from './highlight.jsx';

// Side-by-side parallel reader for passages that have both Pali and an
// English translation. A draggable divider between the two panes lets
// the reader give more real estate to whichever side they're focusing
// on. Each pane keeps the standard Pali / translation typography so the
// stacked-fallback view above stays consistent.
export default function SideBySideReader({ pali, english, englishIsHtml, findText, findStem, glossMap }) {
  const [pct, setPct] = useState(50);
  const containerRef = useRef(null);
  const draggingRef = useRef(false);

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
    // Clamp 20–80 so neither pane can be squashed to unreadable.
    setPct(Math.max(20, Math.min(80, next)));
  }
  function onPointerUp(e) {
    draggingRef.current = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }

  return (
    <div ref={containerRef} style={sideBySideWrap}>
      <div style={{ ...sideBySidePane, flexBasis: `${pct}%` }}>
        <p style={readingOriginal}>
          {glossMap ? withGlosses(pali, glossMap) : highlightFind(pali, findText, findStem)}
        </p>
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
        {englishIsHtml ? (
          <div
            style={{ ...readingTranslation, marginBottom: 18 }}
            dangerouslySetInnerHTML={{ __html: sanitizeDictHtml(english) }}
          />
        ) : (
          <p style={{ ...readingTranslation, marginBottom: 18 }}>{highlightFind(english, findText, findStem)}</p>
        )}
      </div>
    </div>
  );
}

const sideBySideWrap = {
  display: 'flex',
  alignItems: 'stretch',
  margin: '0 0 18px',
  // Narrow viewports fall through to stacked via flex-wrap: the divider
  // and pane stay block-level when the viewport can't fit both 320px wide.
};

const sideBySidePane = {
  flex: '0 0 auto',
  minWidth: 0,        // critical: allow shrink below content's natural width
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
};

const readingTranslation = {
  margin: 0,
  fontFamily: '"Noto Serif", Georgia, serif',
  fontSize: 15,
  lineHeight: 1.8,
  color: 'var(--bc-text-secondary)',
  userSelect: 'text',
  whiteSpace: 'pre-wrap',
};
