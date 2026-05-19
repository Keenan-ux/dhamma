import { useEffect, useRef, useState } from 'react';
import { lookupApi } from './api.js';

// Dedicated page for DPD (Digital Pali Dictionary) lookups. Live-search
// with a small debounce; the same lookup endpoint the in-passage popover
// uses, here surfaced as a full page so a scholar can browse definitions
// without first finding the word in a passage.
export default function DictionaryView({ initialTerm = '' }) {
  const [term, setTerm] = useState(initialTerm);
  const [debounced, setDebounced] = useState(initialTerm.trim());
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(term.trim()), 220);
    return () => clearTimeout(id);
  }, [term]);

  useEffect(() => {
    if (!debounced) { setResult(null); setError(null); setLoading(false); return; }
    const ac = new AbortController();
    setLoading(true); setError(null);
    lookupApi({ term: debounced, signal: ac.signal })
      .then((r) => { setResult(r); setLoading(false); })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setError(err.message);
        setLoading(false);
      });
    return () => ac.abort();
  }, [debounced]);

  const entries = result?.entries || [];
  const matchedVia = result?.matched_via;

  return (
    <div style={page}>
      <header style={pageHeader}>
        <h1 style={pageTitle}>Dictionary</h1>
        <p style={pageSubtitle}>
          Pali → English. <em>Digital Pali Dictionary</em> (Bodhirasa, CC-BY-NC-SA) —
          88,933 headwords, 727,678 inflection mappings.
        </p>
      </header>

      <div style={inputWrap}>
        <input
          ref={inputRef}
          type="text"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Type a Pali word (e.g. sati, sampajāno, dukkha)"
          style={input}
          spellCheck={false}
          autoComplete="off"
        />
        {term && (
          <button onClick={() => setTerm('')} style={clearBtn} aria-label="Clear">×</button>
        )}
      </div>

      <div style={resultsWrap}>
        {!debounced && (
          <p style={hint}>Start typing to look up a word. The lookup is alias-bridged — inflected forms (e.g. <em>sampajāno</em>) resolve to their headword (<em>sampajāna</em>).</p>
        )}
        {loading && <p style={meta}>Looking up <em>{debounced}</em>…</p>}
        {error && <p style={errMsg}>Lookup failed: {error}</p>}

        {!loading && !error && debounced && entries.length === 0 && (
          <p style={meta}>No entry found for <strong>{debounced}</strong> in DPD.</p>
        )}

        {!loading && !error && entries.length > 0 && (
          <>
            <div style={resultHeader}>
              <span style={resultHeaderTerm}>{debounced}</span>
              {matchedVia === 'inflection' && entries[0].lemma && entries[0].lemma !== debounced && (
                <span style={resultHeaderArrow}>→ {entries[0].lemma}</span>
              )}
              <span style={resultHeaderCount}>{entries.length} entr{entries.length === 1 ? 'y' : 'ies'}</span>
            </div>
            {entries.map((e) => (
              <article key={e.id} style={entry}>
                <header style={entryHeader}>
                  <span style={entryLemma}>{e.lemma}</span>
                  {e.pos && <span style={entryPos}>{e.pos}</span>}
                </header>
                {e.grammar && <p style={entryGrammar}>{e.grammar}</p>}
                <p style={entryDefinition}>{e.definition}</p>
                {e.definition_lit && <p style={entryLiteral}>lit. {e.definition_lit}</p>}
                {e.definition_alt && e.definition_alt !== e.definition && (
                  <p style={entryAlt}>also: {e.definition_alt}</p>
                )}
                {(e.sanskrit || e.root || e.construction) && (
                  <footer style={entryFooter}>
                    {e.sanskrit && <span><em>Skt.</em> {e.sanskrit}</span>}
                    {e.root && <span> · <em>root</em> {e.root}</span>}
                    {e.construction && <span> · <em>cons.</em> {e.construction}</span>}
                  </footer>
                )}
                {e.example && <blockquote style={entryExample}>{e.example}</blockquote>}
              </article>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────── styles ───────────────────────────

const page = {
  maxWidth: 880,
  margin: '0 auto',
  padding: '32px 32px 80px',
  height: '100%',
  overflowY: 'auto',
};

const pageHeader = {
  marginBottom: 24,
  paddingBottom: 18,
  borderBottom: '1px solid rgba(var(--bc-accent-rgb), 0.18)',
};

const pageTitle = {
  margin: '0 0 6px',
  fontSize: 26,
  fontFamily: '"Noto Serif", Georgia, serif',
  fontWeight: 500,
  letterSpacing: '-0.01em',
  color: 'var(--bc-text-primary)',
};

const pageSubtitle = {
  margin: 0,
  fontSize: 13,
  color: 'var(--bc-text-tertiary)',
  fontFamily: '"Noto Serif", Georgia, serif',
  lineHeight: 1.55,
};

const inputWrap = {
  position: 'relative',
  marginBottom: 28,
};

const input = {
  width: '100%',
  padding: '14px 44px 14px 16px',
  fontSize: 17,
  fontFamily: '"Noto Serif", Georgia, serif',
  background: 'var(--bc-bg-surface)',
  border: '1px solid rgba(var(--bc-accent-rgb), 0.24)',
  borderRadius: 8,
  color: 'var(--bc-text-primary)',
  outline: 'none',
  fontStyle: 'italic',
  transition: 'border-color 120ms ease',
};

const clearBtn = {
  position: 'absolute',
  right: 12,
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'transparent',
  border: 'none',
  color: 'var(--bc-text-tertiary)',
  fontSize: 24,
  cursor: 'pointer',
  padding: 4,
  lineHeight: 1,
};

const resultsWrap = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const hint = {
  margin: 0,
  fontSize: 13,
  fontStyle: 'italic',
  color: 'var(--bc-text-tertiary)',
  fontFamily: '"Noto Serif", Georgia, serif',
  lineHeight: 1.65,
};

const meta = {
  margin: 0,
  padding: '12px 0',
  fontSize: 13,
  fontStyle: 'italic',
  color: 'var(--bc-text-tertiary)',
};

const errMsg = {
  margin: 0,
  fontSize: 13,
  color: '#f08080',
};

const resultHeader = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 10,
  padding: '8px 0 14px',
  borderBottom: '1px solid rgba(var(--bc-accent-rgb), 0.12)',
  marginBottom: 8,
};

const resultHeaderTerm = {
  fontSize: 18,
  fontStyle: 'italic',
  fontFamily: '"Noto Serif", Georgia, serif',
  color: 'var(--bc-accent)',
};

const resultHeaderArrow = {
  fontSize: 13,
  fontStyle: 'italic',
  color: 'var(--bc-text-tertiary)',
  fontFamily: '"Noto Serif", Georgia, serif',
};

const resultHeaderCount = {
  marginLeft: 'auto',
  fontSize: 11,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--bc-text-tertiary)',
};

const entry = {
  padding: '16px 0',
  borderBottom: '1px solid rgba(var(--bc-accent-rgb), 0.08)',
};

const entryHeader = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 10,
  marginBottom: 6,
};

const entryLemma = {
  fontSize: 18,
  fontWeight: 600,
  fontFamily: '"Noto Serif", Georgia, serif',
  color: 'var(--bc-text-primary)',
};

const entryPos = {
  fontSize: 12,
  fontStyle: 'italic',
  color: 'var(--bc-text-tertiary)',
};

const entryGrammar = {
  margin: '0 0 6px',
  fontSize: 12,
  fontStyle: 'italic',
  color: 'var(--bc-text-tertiary)',
  fontFamily: '"Noto Serif", Georgia, serif',
};

const entryDefinition = {
  margin: '0 0 4px',
  fontSize: 15,
  fontFamily: '"Noto Serif", Georgia, serif',
  color: 'var(--bc-text-primary)',
  lineHeight: 1.6,
};

const entryLiteral = {
  margin: '0 0 4px',
  fontSize: 13,
  fontStyle: 'italic',
  color: 'var(--bc-text-secondary)',
  fontFamily: '"Noto Serif", Georgia, serif',
};

const entryAlt = {
  margin: '0 0 4px',
  fontSize: 13,
  color: 'var(--bc-text-secondary)',
  fontFamily: '"Noto Serif", Georgia, serif',
};

const entryFooter = {
  marginTop: 6,
  fontSize: 11,
  color: 'var(--bc-text-tertiary)',
  fontFamily: '"Noto Serif", Georgia, serif',
};

const entryExample = {
  margin: '10px 0 0',
  padding: '6px 12px',
  borderLeft: '2px solid rgba(var(--bc-accent-rgb), 0.30)',
  fontSize: 13,
  fontStyle: 'italic',
  color: 'var(--bc-text-secondary)',
  fontFamily: '"Noto Serif", Georgia, serif',
  lineHeight: 1.55,
};
