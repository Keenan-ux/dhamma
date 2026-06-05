import { useEffect, useRef, useState } from 'react';
import { lookupApi } from './api.js';
import { prepareDppnHtml, preparePedHtml, sanitizeDictHtml, groupEntriesBySource, SOURCE_LABEL } from './dictHtml.js';
import { SelectionActions } from './SelectionActions.jsx';

// Threshold above which an HTML-source entry (DPPN biography, PED
// long lexicon entry) is collapsed to a preview with a "Show more"
// toggle. ~600 chars renders as roughly 4-5 lines of body text — long
// enough to need collapsing, short enough that the user can read a
// one-paragraph entry without clicking through.
const HTML_COLLAPSE_THRESHOLD = 600;

const HTML_PREPARERS = { dppn: prepareDppnHtml, ped: preparePedHtml };

function DictEntry({ entry: e }) {
  const [expanded, setExpanded] = useState(false);
  const prepare = HTML_PREPARERS[e.source];
  if (prepare) {
    const long = (e.definition || '').length > HTML_COLLAPSE_THRESHOLD;
    return (
      <article style={entry}>
        <header style={entryHeader}>
          <span style={entryLemma}>{e.source_id || e.lemma}</span>
        </header>
        <div
          style={{ ...entryDefinition, ...(long && !expanded ? entryClampedDppn : entryHtmlDppn) }}
          dangerouslySetInnerHTML={{ __html: prepare(e.definition) }}
        />
        {long && (
          <button onClick={() => setExpanded((x) => !x)} style={expandBtn}>
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </article>
    );
  }
  return (
    <article style={entry}>
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
      {e.example && (
        <blockquote
          style={entryExample}
          dangerouslySetInnerHTML={{ __html: sanitizeDictHtml(e.example) }}
        />
      )}
    </article>
  );
}

const MODES = [
  { key: 'exact',   label: 'Exact',   hint: 'Headword/lemma exact match only — strict, no fallback' },
  { key: 'stem',    label: 'Stem',    hint: 'Lenient Pali: inflections, prefixes, compounds, plus English-reverse for English queries' },
  { key: 'meaning', label: 'Meaning', hint: 'Vector ANN over definitions — type an English phrase, find related Pali words' },
];

const DIACRITICS = ['ā', 'ī', 'ū', 'ē', 'ō', 'ṃ', 'ṅ', 'ñ', 'ṇ', 'ṭ', 'ḍ', 'ṛ', 'ḷ', 'ṣ', 'ś'];

function DotPulse() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setN((x) => (x + 1) % 4), 400);
    return () => clearInterval(id);
  }, []);
  return <span aria-hidden style={dotPulse}>{'.'.repeat(n)}</span>;
}

// Dedicated page for dictionary lookups. Live-search with a small
// debounce; the same lookup endpoint the in-passage popover uses, here
// surfaced as a full page so a scholar can browse definitions without
// first finding the word in a passage. Three match modes (Exact / Stem
// / Meaning) mirror SearchView. Results are grouped by source: DPD
// (lexical), DPPN (proper names), PED (PTS lexicon).
export default function DictionaryView({ initialTerm = '', onSearchTerm, onCompareTerm }) {
  const [term, setTerm] = useState(initialTerm);
  const [debounced, setDebounced] = useState(initialTerm.trim());
  const [mode, setMode] = useState('stem');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMs, setLoadingMs] = useState(0);
  // When Stem returns 0 entries, the view silently fires a Meaning
  // lookup and labels its results so the user knows what happened.
  // Tracked separately so we don't display the "no entry found"
  // empty state for the brief moment between the two fetches.
  const [bridgedFromStem, setBridgedFromStem] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(term.trim()), 220);
    return () => clearTimeout(id);
  }, [term]);

  useEffect(() => {
    if (!debounced) {
      setResult(null); setError(null); setLoading(false); setBridgedFromStem(false);
      return;
    }
    const ac = new AbortController();
    setLoading(true); setError(null); setLoadingMs(0); setBridgedFromStem(false);
    const startedAt = Date.now();
    const tick = setInterval(() => setLoadingMs(Date.now() - startedAt), 250);

    (async () => {
      try {
        const r = await lookupApi({ term: debounced, mode, signal: ac.signal });
        // Auto-bridge: Stem mode with 0 results → silently fall back to
        // Meaning so the user gets something useful instead of a dead end.
        if (mode === 'stem' && (r.entries?.length ?? 0) === 0) {
          const bridged = await lookupApi({ term: debounced, mode: 'meaning', signal: ac.signal });
          if (!ac.signal.aborted) {
            setResult(bridged);
            setBridgedFromStem(true);
            setLoading(false);
          }
        } else if (!ac.signal.aborted) {
          setResult(r);
          setLoading(false);
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        setError(err.message);
        setLoading(false);
      } finally {
        clearInterval(tick);
      }
    })();

    return () => { ac.abort(); clearInterval(tick); };
  }, [debounced, mode]);

  function insertChar(ch) {
    const el = inputRef.current;
    if (!el) { setTerm((t) => t + ch); return; }
    const start = el.selectionStart ?? term.length;
    const end = el.selectionEnd ?? term.length;
    const next = term.slice(0, start) + ch + term.slice(end);
    setTerm(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + ch.length;
      el.setSelectionRange(pos, pos);
    });
  }

  const entries = result?.entries || [];
  const matchedVia = result?.matched_via;
  const groups = groupEntriesBySource(entries);

  return (
    <div data-scroll-root="" style={scroller}>
      <div style={page}>
      <header style={pageHeader}>
        <h1 style={pageTitle}>Dictionary</h1>
        <p style={pageSubtitle}>
          Pali → English. <em>Digital Pali Dictionary</em> (Bodhirasa, CC-BY-NC-SA)
          — 88,933 headwords, 727,678 inflection mappings · <em>Dictionary of Pali
          Proper Names</em> (Malalasekera, rev. Ānandajoti 2025) — 13,603 entries ·
          <em> Pali-English Dictionary</em> (Rhys Davids &amp; Stede, 1921–25,
          CC BY-NC 3.0) — 15,702 entries.
        </p>
      </header>

      <div style={inputWrap}>
        <input
          ref={inputRef}
          type="text"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={
            mode === 'meaning'
              ? 'Describe a meaning (e.g. impermanence, the chief disciple)'
              : 'Type a Pali word (e.g. sati, sampajāno, dukkha)'
          }
          style={input}
          spellCheck={false}
          autoComplete="off"
          aria-label="Search the dictionary"
        />
        {term && (
          <button onClick={() => setTerm('')} style={clearBtn} aria-label="Clear">×</button>
        )}
      </div>

      <div style={diacriticsRow} aria-label="Insert Pali diacritic">
        {DIACRITICS.map((ch) => (
          <button key={ch} onClick={() => insertChar(ch)} style={diacriticBtn} title={`Insert ${ch}`}>
            {ch}
          </button>
        ))}
      </div>

      <div style={modeRow} aria-label="Match mode">
        <span style={modeLabel}>Match</span>
        {MODES.map((opt) => {
          const on = mode === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => setMode(opt.key)}
              title={opt.hint}
              style={{
                ...modeBtn,
                color: on ? 'var(--bc-accent)' : 'var(--bc-text-tertiary)',
                borderBottomColor: on ? 'var(--bc-accent)' : 'transparent',
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <div style={resultsWrap} ref={resultsRef}>
        <SelectionActions
          containerRef={resultsRef}
          onSearch={onSearchTerm}
          onCompare={onCompareTerm}
        />
        {!debounced && (
          <>
            <p style={hint}>
              Start typing to look up a word. <strong>Stem</strong> mode (default)
              is lenient — inflected forms like <em>sampajāno</em> resolve to
              <em> sampajāna</em>, and typing without diacritics still works.{' '}
              <strong>Meaning</strong> mode treats your input as a description and
              returns semantically related entries via vector search.
            </p>
            {mode === 'meaning' && (
              <p style={hintNote}>
                Heads up: the first Meaning query after the server has been idle
                for a while takes ~2 minutes — the BGE-M3 embedding model has to
                load into memory. Subsequent queries are sub-second until the
                machine idles back to sleep.
              </p>
            )}
          </>
        )}
        {loading && (
          <div style={loadingWrap}>
            <p style={meta}>
              Looking up <em>{debounced}</em>
              <DotPulse />
            </p>
            {mode === 'meaning' && loadingMs > 2500 && (
              <div style={loadingHint}>
                <p style={loadingHintPrimary}>
                  First Meaning query on a cold container loads the BGE-M3
                  embedding model — about two minutes. After that, queries
                  are sub-second until the machine idles back to sleep.
                </p>
                <p style={loadingHintSecondary}>
                  {Math.floor(loadingMs / 1000)}s elapsed
                  {loadingMs > 30000 && ' · still loading the model'}
                  {loadingMs > 90000 && ' · almost there, the cold-start is ~120s'}
                </p>
              </div>
            )}
          </div>
        )}
        {error && <p style={errMsg}>Lookup failed: {error}</p>}

        {!loading && !error && debounced && entries.length === 0 && (
          <p style={meta}>
            No entry found for <strong>{debounced}</strong>
            {mode === 'exact' && (
              <> in exact mode. Try <button onClick={() => setMode('stem')} style={inlineModeLink}>Stem</button> or <button onClick={() => setMode('meaning')} style={inlineModeLink}>Meaning</button>.</>
            )}
            {mode === 'stem' && (
              <>. Try <button onClick={() => setMode('meaning')} style={inlineModeLink}>Meaning</button> mode for a semantic search.</>
            )}
            {mode !== 'exact' && mode !== 'stem' && '.'}
          </p>
        )}

        {!loading && !error && entries.length > 0 && (
          <>
            <div style={resultHeader}>
              <span style={resultHeaderTerm}>{debounced}</span>
              {matchedVia === 'inflection' && entries[0].lemma && entries[0].lemma !== debounced && (
                <span style={resultHeaderArrow}>→ {entries[0].lemma}</span>
              )}
              {matchedVia === 'compound' && (
                <span style={resultHeaderArrow}>· likely a compound, showing components</span>
              )}
              {matchedVia === 'english-reverse' && (
                <span style={resultHeaderArrow}>· Pali words meaning this</span>
              )}
              {matchedVia === 'meaning' && !bridgedFromStem && (
                <span style={resultHeaderArrow}>· semantically near</span>
              )}
              <span style={resultHeaderCount}>{entries.length} entr{entries.length === 1 ? 'y' : 'ies'}</span>
            </div>
            {bridgedFromStem && (
              <div style={bridgeBanner} role="status">
                No exact lexical match for <strong>{debounced}</strong>. Showing
                the closest entries by meaning instead — that&apos;s what{' '}
                <button onClick={() => setMode('meaning')} style={inlineModeLink}>Meaning</button>{' '}
                mode does on demand.
              </div>
            )}
            {groups.map((g) => (
              <section key={g.source} style={groupSection}>
                <h2 style={groupHeader}>
                  <span style={groupHeaderName}>{SOURCE_LABEL[g.source]?.name || g.source}</span>
                  <span style={groupHeaderCount}>{g.entries.length}</span>
                </h2>
                {g.entries.map((e) => (
                  <DictEntry key={e.id} entry={e} />
                ))}
              </section>
            ))}
          </>
        )}
      </div>
      </div>
    </div>
  );
}

// ─────────────────────────── styles ───────────────────────────

const scroller = { position: 'absolute', inset: 0, overflow: 'auto', paddingTop: 56 };

const page = {
  maxWidth: 880,
  margin: 0,
  padding: '28px 28px 48px',
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
  color: 'var(--bc-loss-text)',
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

const groupSection = {
  marginBottom: 18,
};

const groupHeader = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 8,
  margin: '14px 0 6px',
  padding: '0 0 4px',
  borderBottom: '1px solid rgba(var(--bc-accent-rgb), 0.18)',
  fontFamily: '"Noto Serif", Georgia, serif',
  fontWeight: 400,
};

const groupHeaderName = {
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--bc-accent)',
};

const groupHeaderCount = {
  fontSize: 11,
  color: 'var(--bc-text-tertiary)',
  letterSpacing: '0.05em',
};

const entryClampedDppn = {
  maxHeight: '12em',
  overflow: 'hidden',
  position: 'relative',
  WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
  maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
};

const entryHtmlDppn = {
  // DPPN entries render as flowing paragraphs — multiple <p> blocks
  // inside the definition need their own top margin reset since the
  // outer container already gives spacing.
};

const expandBtn = {
  marginTop: 6,
  padding: '2px 0',
  background: 'transparent',
  border: 'none',
  fontFamily: '"Noto Serif", Georgia, serif',
  fontStyle: 'italic',
  fontSize: 12,
  color: 'var(--bc-accent)',
  cursor: 'pointer',
};

const modeRow = {
  display: 'flex',
  gap: 4,
  flexWrap: 'wrap',
  alignItems: 'baseline',
  marginBottom: 18,
};

const modeLabel = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--bc-text-tertiary)',
  marginRight: 12,
  flexShrink: 0,
};

const modeBtn = {
  padding: '6px 10px',
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid transparent',
  fontFamily: 'Outfit, system-ui, sans-serif',
  fontSize: 12,
  fontWeight: 500,
  letterSpacing: '0.02em',
  cursor: 'pointer',
  transition: 'color 120ms ease, border-color 120ms ease',
};

const hintNote = {
  margin: '10px 0 0',
  padding: '8px 12px',
  borderLeft: '2px solid rgba(var(--bc-accent-rgb), 0.30)',
  background: 'rgba(var(--bc-accent-rgb), 0.04)',
  fontSize: 12,
  fontStyle: 'italic',
  lineHeight: 1.55,
  color: 'var(--bc-text-secondary)',
  fontFamily: '"Noto Serif", Georgia, serif',
};

const bridgeBanner = {
  margin: '0 0 14px',
  padding: '8px 12px',
  borderLeft: '2px solid rgba(var(--bc-accent-rgb), 0.30)',
  background: 'rgba(var(--bc-accent-rgb), 0.04)',
  fontSize: 12,
  fontStyle: 'italic',
  lineHeight: 1.55,
  color: 'var(--bc-text-secondary)',
  fontFamily: '"Noto Serif", Georgia, serif',
};

const diacriticsRow = {
  display: 'flex',
  gap: 2,
  flexWrap: 'wrap',
  marginTop: -8,
  marginBottom: 14,
};

const diacriticBtn = {
  width: 30,
  height: 30,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'transparent',
  border: '1px solid transparent',
  color: 'var(--bc-text-secondary)',
  fontFamily: '"Noto Serif", Georgia, serif',
  fontSize: 15,
  cursor: 'pointer',
  borderRadius: 4,
  transition: 'border-color 100ms ease, color 100ms ease',
};

const inlineModeLink = {
  background: 'transparent',
  border: 'none',
  padding: 0,
  fontFamily: 'inherit',
  fontSize: 'inherit',
  color: 'var(--bc-accent)',
  cursor: 'pointer',
  textDecoration: 'underline',
  textUnderlineOffset: 2,
};

const loadingWrap = {
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
};

const dotPulse = {
  display: 'inline-block',
  marginLeft: 1,
  minWidth: '1.2em',
  color: 'var(--bc-accent)',
  fontFamily: 'monospace',
};

const loadingHint = {
  padding: '10px 14px',
  borderLeft: '2px solid rgba(var(--bc-accent-rgb), 0.30)',
  background: 'rgba(var(--bc-accent-rgb), 0.04)',
  fontFamily: '"Noto Serif", Georgia, serif',
};

const loadingHintPrimary = {
  margin: 0,
  fontSize: 13,
  lineHeight: 1.5,
  color: 'var(--bc-text-secondary)',
};

const loadingHintSecondary = {
  margin: '6px 0 0',
  fontSize: 11,
  fontStyle: 'italic',
  letterSpacing: '0.02em',
  color: 'var(--bc-text-tertiary)',
};
