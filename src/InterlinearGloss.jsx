import { useEffect, useMemo, useRef, useState } from 'react';
import { glossApi } from './api.js';

// Interlinear gloss reader. Given a chunk of Pāli text, renders each
// word as a small stacked pair: the Pāli surface form on top (serif,
// reading size) with its short English gloss set beneath in small
// type. Glosses come from the DPD inflection table via /api/gloss
// (surface → inflection → headword → first short meaning). No AI.
//
// Words we can't resolve render with their Pāli on top and a thin
// placeholder line below so the column stays visually even — the
// reader can tell "no gloss found" from "gloss omitted". Punctuation
// and whitespace pass through inline between word-pairs.
//
// This is the column-replacement counterpart to the lighter
// hover-tooltip gloss (withGlosses in browse/highlight.jsx): same
// data source, but laid out as a true interlinear instead of an
// underline + native title= tooltip.

const WORD_RE = /(\p{L}+)/u;
const SPLIT_RE = /(\p{L}+)/gu;
const MAX_WORDS = 200;

// Pull just the unique lowercased word tokens out of the passage —
// the same tokenisation the server's /api/gloss applies. Capped so a
// pathologically long commentary paragraph can't blow the request up.
function uniqueWords(text) {
  const matches = String(text || '').toLowerCase().match(SPLIT_RE) || [];
  return Array.from(new Set(matches)).slice(0, MAX_WORDS);
}

export default function InterlinearGloss({ text, style }) {
  const [glossMap, setGlossMap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const lastText = useRef(null);

  const words = useMemo(() => uniqueWords(text), [text]);

  useEffect(() => {
    if (!text || words.length === 0) { setGlossMap({}); return; }
    // Cheap guard against refetching when the parent re-renders with
    // identical text (find-bar typing, scroll chrome mutations, etc.).
    if (lastText.current === text && glossMap) return;
    lastText.current = text;
    const ac = new AbortController();
    setLoading(true);
    setFailed(false);
    glossApi(words, { signal: ac.signal })
      .then((r) => { setGlossMap(r.glosses || {}); setLoading(false); })
      .catch((err) => {
        if (ac.signal.aborted) return;
        setGlossMap({});
        setFailed(true);
        setLoading(false);
      });
    return () => ac.abort();
    // glossMap intentionally omitted — including it would re-run on its
    // own update. The lastText ref handles the dedupe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, words]);

  if (!text) return null;

  // Paragraph-group passages carry `\n\n` between source paragraphs;
  // render each as its own block so the interlinear keeps the visual
  // breaks the plain reader has.
  const paragraphs = String(text).includes('\n\n')
    ? String(text).split(/\n{2,}/).filter((p) => p.trim().length > 0)
    : [String(text)];

  return (
    <div style={style}>
      {loading && !glossMap && (
        <div style={statusLine}>resolving glosses…</div>
      )}
      {failed && (
        <div style={statusLine}>glosses unavailable — showing Pāli only</div>
      )}
      {paragraphs.map((para, pi) => (
        <p key={pi} style={pi > 0 ? paragraphSpaced : paragraph}>
          {renderTokens(para, glossMap || {})}
        </p>
      ))}
    </div>
  );
}

// Split a paragraph into word / non-word tokens (the SPLIT_RE capture
// keeps both). Word tokens become stacked Pāli+gloss pairs; everything
// else (spaces, punctuation, danda) renders inline so sentence shape
// survives.
function renderTokens(para, glossMap) {
  const parts = String(para).split(SPLIT_RE);
  return parts.map((part, i) => {
    // Even indices are separators (spaces / punctuation), odd are words.
    if (i % 2 === 0) {
      if (!part) return null;
      return <span key={i} style={separator}>{part}</span>;
    }
    const g = glossMap[part.toLowerCase()];
    return (
      <span key={i} style={pairCell}>
        <span style={paliWord}>{part}</span>
        {g
          ? (
            <span style={glossText} title={`${g.headword} (${(g.source || '').toUpperCase()})`}>
              {g.def || g.headword}
            </span>
          )
          : <span style={glossEmpty} aria-hidden="true">·</span>}
      </span>
    );
  });
}

// --- styles (inline, var(--bc-*) only) ----------------------------------

const paragraph = {
  margin: '0 0 18px',
  // Looser line-height than prose so the stacked gloss line doesn't
  // collide with the row above.
  lineHeight: 2.9,
};
const paragraphSpaced = { ...paragraph, marginTop: '0.4em' };

// Each Pāli word + its gloss form one inline-block cell so they stay
// vertically aligned and wrap together at line ends.
const pairCell = {
  display: 'inline-flex',
  flexDirection: 'column',
  alignItems: 'center',
  verticalAlign: 'baseline',
  margin: '0 4px',
  textAlign: 'center',
};

const paliWord = {
  fontFamily: '"Noto Serif", Georgia, serif',
  fontSize: 17,
  lineHeight: 1.2,
  color: 'var(--bc-text-primary)',
  whiteSpace: 'nowrap',
};

const glossText = {
  fontFamily: 'Outfit, system-ui, sans-serif',
  fontSize: 10.5,
  lineHeight: 1.25,
  color: 'var(--bc-text-tertiary)',
  marginTop: 2,
  maxWidth: 140,
  // Keep a single gloss from ballooning a cell too wide; longer defs
  // clamp with ellipsis (the full headword/def is in the title tooltip).
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
};

const glossEmpty = {
  fontSize: 10.5,
  lineHeight: 1.25,
  color: 'rgba(var(--bc-accent-rgb), 0.28)',
  marginTop: 2,
};

const separator = {
  whiteSpace: 'pre-wrap',
  color: 'var(--bc-text-primary)',
};

const statusLine = {
  fontFamily: 'Outfit, system-ui, sans-serif',
  fontSize: 12,
  color: 'var(--bc-text-tertiary)',
  marginBottom: 12,
  fontStyle: 'italic',
};
