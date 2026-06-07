import { useEffect, useMemo, useRef, useState } from 'react';
import { collectLeaves } from '../data/corpus.js';
import { groupLeaves, findGroupContext } from './paragraphGroup.js';
import { SelectionActions } from '../SelectionActions.jsx';
import { isModifiedClick } from '../linkHelpers.js';
import useNotes from '../useNotes.js';
import useSegmentHover from './useSegmentHover.js';
import { passageParallelsApi, passageTagsApi, glossApi, passageGroupApi, passageGroupTranslationsApi, passageCommentaryApi } from '../api.js';
import { paragraphGroupId } from './paragraphGroup.js';
import { sanitizeDictHtml } from '../dictHtml.js';
import { formatCitation, prettifyVinayaCitation } from '../citationFormat.js';
import useBookmarks from '../useBookmarks.js';
import useIsNarrow from '../useIsNarrow.js';
import { paliStem } from '../paliStem.js';
import { escapeRegExp, highlightFind, withGlosses } from './highlight.jsx';
import { filterBodySegments } from './segments.js';
import InterlinearGloss from '../InterlinearGloss.jsx';

// Renders one column of a passage segment-by-segment when the passage
// has bilara segment metadata; otherwise falls back to a single <p>
// with the joined text. data-segment + data-passage-id on each span
// powers dual-highlight and notes-anchoring. Segments inside a note's
// range get a `dhamma-seg-noted` class for the left-edge marker.
function SegmentColumn({ passage, language, fallback, findText, findStem, glossMap, noteRanges, style }) {
  const hasTitle = !!(passage?.title || passage?.title_en);
  const keys = passage?.segments ? filterBodySegments(passage.segments, hasTitle) : [];
  if (!passage?.segments || keys.length === 0) {
    // Merged paragraph-group passages come in with body text containing
    // `\n\n` between source paragraphs. Render each as its own <p> so
    // the reader sees visual breaks instead of one wall of text.
    const text = fallback || '';
    const parts = text.includes('\n\n') ? text.split(/\n{2,}/).filter(Boolean) : [text];
    return (
      <div style={style}>
        {parts.map((part, i) => (
          <p key={i} style={i > 0 ? { marginTop: '0.85em' } : undefined}>
            {language === 'pali' && glossMap
              ? withGlosses(part, glossMap)
              : highlightFind(part, findText, findStem)}
          </p>
        ))}
      </div>
    );
  }
  return (
    <div style={style}>
      {keys.map((k) => {
        const seg = passage.segments[k];
        if (!seg) return null;
        const text = seg[language] || '';
        if (!text) return null;
        const noted = isSegmentNoted(k, noteRanges);
        const cls = [
          'dhamma-seg',
          language === 'pali' ? 'dhamma-seg-pali' : 'dhamma-seg-en',
          noted ? 'dhamma-seg-noted' : '',
        ].filter(Boolean).join(' ');
        return (
          <span
            key={k}
            className={cls}
            data-segment={k}
            data-passage-id={passage.id}
          >
            {language === 'pali' && glossMap
              ? withGlosses(text, glossMap)
              : highlightFind(text, findText, findStem)}
            {' '}
          </span>
        );
      })}
    </div>
  );
}

function isSegmentNoted(k, ranges) {
  if (!ranges || ranges.length === 0) return false;
  for (const r of ranges) {
    if (compareSegKeys(k, r.startKey) >= 0 && compareSegKeys(k, r.endKey) <= 0) return true;
  }
  return false;
}
import SideBySideReader from './SideBySideReader.jsx';

// Pali diacritic shortcuts for the in-passage find input. Same set
// the main SearchView offers.
const FIND_DIACRITICS = ['ā', 'ī', 'ū', 'ē', 'ō', 'ṃ', 'ṅ', 'ñ', 'ṇ', 'ṭ', 'ḍ', 'ḷ', 'ḥ', 'ṛ'];

// Paragraph-range bucket size for the section dropdown when a long group
// has no subhead structure (single-title giants like KN-a §8 = 2,799
// rows). Matches the server's default page so a bucket is one page.
const GROUP_BUCKET = 100;

const TRANSLATOR_LABEL = {
  sujato: 'Bhante Sujato',
  thanissaro: 'Thanissaro Bhikkhu',
  walshe: 'Maurice Walshe',
  ireland: 'John D. Ireland',
  olendzki: 'Andrew Olendzki',
  buddharakkhita: 'Acharya Buddharakkhita',
  nyanaponika: 'Nyanaponika Thera',
  nanamoli: 'Ñāṇamoli Thera',
  piyadassi: 'Piyadassi Thera',
  bodhi: 'Bhikkhu Bodhi',
  narada: 'Nārada Thera',
  soma: 'Soma Thera',
  nyanasatta: 'Nyanasatta Thera',
  'sister-uppalavanna': 'Sister Uppalavanna',
  'nanamoli-bodhi': 'Ñāṇamoli & Bodhi',
  horner: 'I. B. Horner',
  hare: 'E. M. Hare',
  'amaravati-sangha': 'Amaravati Sangha',
  nizamis: 'Nizamis',
  hecker: 'Hellmuth Hecker',
  vajira: 'Sister Vajira',
  kelly: 'John Kelly',
  harvey: 'Peter Harvey',
  sonadhammo: 'Sonadhammo',
  kandy: 'Kandy News-Wheel',
  // SuttaCentral CC0 community translators (ingested via
  // ingest-sc-translators.mjs). Brahmali is the main Vinaya translator
  // on SC; the others fill scattered Khuddaka + verse coverage.
  brahmali: 'Bhikkhu Brahmali',
  anandajoti: 'Bhikkhu Ānandajoti',
  kovilo: 'Kovilo Bhikkhu',
  suddhaso: 'Bhante Suddhāso',
  patton: 'Charles Patton',
};

// Replace CST raw IDs ("E0806N-NRF §354") with the readable work name
// when one is available. Same logic as PassageCard's displayCitation —
// duplicated here to keep the components decoupled until a third
// consumer justifies a shared util.
const CST_PREFIX_RE = /^[A-Z]\d+[A-Z]?-[A-Z]+\s+/;
function displayCitation(citation, workName) {
  if (!citation) return citation;
  // Vinaya UID cleanup first — independent of workName.
  const vinaya = prettifyVinayaCitation(citation);
  if (vinaya !== citation) return vinaya;
  if (!workName || !CST_PREFIX_RE.test(citation)) return citation;
  const rest = citation.replace(CST_PREFIX_RE, '').trim();
  return rest ? `${workName} ${rest}` : workName;
}

export default function ReadingPanel({
  passage: anchorPassage, tree, workBySlug,
  leafId,
  pinnedLeafId, setPinnedLeafId,
  readingMode, setReadingMode,
  onNavigate, onBrowseToPath, onSearchTerm, onCompareTerm,
  compact,
  inSplitPane,   // true when this panel is rendered as one of two
                 // columns in the split-pane viewer. The pin-to-top
                 // icon makes no sense there (both passages are
                 // already shown) — hide it.
  onBack,        // optional handler that exits the reader back to the
                 // canon drill. Rendered as a "← Back to canon" row
                 // at the top of the sticky reader header on desktop.
                 // Hidden on mobile where the OS/browser back gesture
                 // covers the same need.
  highlightTerms, // array of strings — search-context highlights. When
                  // non-empty and the find bar is empty, the passage is
                  // rendered with these terms marked. The user can
                  // override by typing in the find bar.
  highlightStem,  // boolean — whether to apply paliStem matching to
                  // highlightTerms. Comes from the search mode (Stem
                  // and Meaning modes use stem-bridged matching).
  focusSegment,   // segment key ("1.3") to scroll-to + flash on
                  // mount. Set when the reader is opened from the
                  // Notes index. ClearFocusSegment fires once the
                  // scroll-to runs so a later nav doesn't re-trigger.
  clearFocusSegment,
}) {
  const ref = useRef(null);
  const isPinned = pinnedLeafId === leafId;

  // Paragraph-group fetch — Step 2 of the per-<p> CST subdivision UX.
  // When the anchor passage is a fine paragraph row (id ends in
  // `_pNNN`), pull every sibling row under the same parent div via
  // /api/passage/:id/group and merge them into one "logical page"
  // passage object for rendering. Originals + translations get
  // concatenated; per-row segments are dropped (segments are only
  // meaningful per-row, and fine CST rows don't carry segment JSON
  // anyway — that's a SuttaCentral bilara thing).
  //
  // Singleton groups (canonical mula, anya, library, Vism coarse)
  // pass through unchanged: the merged passage equals the anchor.
  const [group, setGroup] = useState(null);
  // Which window of a long paragraph group is visible. `anchorId` ties
  // the view to a passage so it resets to defaults when the reader opens
  // a different one (no stale cursor carried across). window undefined =>
  // the server's default page; 'all' => the whole group (Show all).
  // cursor undefined => start at the anchor row.
  const [groupView, setGroupView] = useState({ anchorId: null, window: undefined, cursor: undefined });
  const view = groupView.anchorId === anchorPassage?.id
    ? groupView
    : { window: undefined, cursor: undefined };
  const setView = (next) => setGroupView({ anchorId: anchorPassage?.id, ...next });

  useEffect(() => {
    if (!anchorPassage?.id) { setGroup(null); return; }
    // Skip the fetch for singleton ids — saves a network round-trip
    // for the 9/10 cases where there's nothing to merge.
    if (!paragraphGroupId(anchorPassage.id)) { setGroup(null); return; }
    const ac = new AbortController();
    passageGroupApi(anchorPassage.id, { window: view.window, cursor: view.cursor, signal: ac.signal })
      .then((r) => setGroup(r))
      .catch((e) => { if (e.name !== 'AbortError') setGroup(null); });
    return () => ac.abort();
    // view.window / view.cursor drive re-fetch on page / section / show-all.
  }, [anchorPassage?.id, view.window, view.cursor]);

  const passage = useMemo(() => {
    if (!anchorPassage) return anchorPassage;
    if (!group || !group.group || group.group.length <= 1) return anchorPassage;
    const rows = group.group;
    // Merge originals + translations into one continuous block.
    // Paragraphs are separated by a blank line so the rendered <p>
    // breaks them visually. Each paragraph keeps its own text but
    // the rendered passage acts as one document for find / highlight
    // / glosses / copy-citation purposes.
    const mergedOriginal = rows.map((r) => r.original).filter(Boolean).join('\n\n');
    const mergedTranslation = rows.map((r) => r.translation).filter(Boolean).join('\n\n');
    return {
      ...anchorPassage,
      original: mergedOriginal || anchorPassage.original,
      translation: mergedTranslation || anchorPassage.translation,
      segments: null,
      // Annotate the merged passage with the group size so downstream
      // code (e.g. the multi-translator dropdown) can branch on it
      // without re-running the LIKE pattern check.
      _groupSize: rows.length,
      _groupAnchor: anchorPassage.id,
    };
  }, [anchorPassage, group]);

  // ── Long-commentary navigation ─────────────────────────────────────
  // A merged paragraph group can run to thousands of rows (the worst is
  // ~2,800). The server returns one windowed page plus { total, offset,
  // sections } so the reader pages through and jumps to sections without
  // rendering the whole division. Short groups (<= one page) come back
  // whole and the navigator below self-hides.
  const groupTotal = group?.total ?? 0;
  const groupOffset = group?.offset ?? 0;
  const groupShown = group?.group?.length ?? 0;
  const groupSections = group?.sections ?? [];
  const showAll = view.window === 'all';
  const isLongGroup = groupTotal > 0 && (groupTotal > groupShown || showAll);

  // Dropdown targets: real subhead sections when the group has them (a
  // true table of contents), else synthetic paragraph-range buckets for
  // single-title giants so the reader can still leap far in one step.
  const groupNavOptions = useMemo(() => {
    if (groupSections.length > 1) {
      return groupSections.map((s) => ({
        index: s.index,
        label: s.title
          ? (s.citation ? `${s.title} · ${s.citation}` : s.title)
          : `Paragraph ${s.index + 1}`,
      }));
    }
    if (groupTotal > GROUP_BUCKET) {
      const out = [];
      for (let i = 0; i < groupTotal; i += GROUP_BUCKET) {
        out.push({ index: i, label: `Paragraphs ${i + 1}–${Math.min(groupTotal, i + GROUP_BUCKET)}` });
      }
      return out;
    }
    return [];
  }, [groupSections, groupTotal]);

  // The option the current window sits in (greatest start index <= offset).
  const groupNavCurrent = useMemo(() => {
    let cur = groupNavOptions[0]?.index ?? 0;
    for (const o of groupNavOptions) { if (o.index <= groupOffset) cur = o.index; else break; }
    return cur;
  }, [groupNavOptions, groupOffset]);

  // Jump to a section / bucket: always lands on a default page at that
  // index (so it also collapses Show-all back to a page there).
  const goToGroupIndex = (idx) => setView({ cursor: idx });
  const groupPrevPage = () => setView({ cursor: Math.max(0, groupOffset - groupShown) });
  const groupNextPage = () => setView({ cursor: groupOffset + groupShown });
  const toggleGroupShowAll = () => setView(showAll ? { cursor: groupOffset } : { window: 'all', cursor: 0 });

  // Scroll the reader back to the top when the window moves by a user
  // action (paging / section jump / show-all) — but not on the initial
  // open of a passage, which keeps the caller's scroll position.
  const groupNavRef = useRef({ anchor: null, offset: null });
  useEffect(() => {
    if (!group) { groupNavRef.current = { anchor: null, offset: null }; return; }
    const a = anchorPassage?.id;
    const prev = groupNavRef.current;
    const userMoved = prev.anchor === a && prev.offset != null && prev.offset !== group.offset;
    groupNavRef.current = { anchor: a, offset: group.offset };
    if (userMoved && ref.current) {
      ref.current.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
  }, [group, anchorPassage?.id]);

  // Dual-highlight at the reader root: covers the side-by-side path,
  // the stacked single-column path on narrow viewports, AND the case
  // where the user has an ATI translator selected (englishIsHtml so
  // the English column renders as HTML but the Pāli column still has
  // segment markers). The hook is scoped to `ref` so two readers
  // mounted simultaneously (pinned + active) don't cross-talk.
  useSegmentHover(ref);

  // Scroll-to + flash on focusSegment. Runs after the segments are
  // in the DOM (passage data has loaded and rendering ran). Once the
  // scroll-to fires, clear the focus so a later in-passage nav
  // doesn't re-trigger it.
  useEffect(() => {
    if (!focusSegment || !passage?.id) return;
    const root = ref.current;
    if (!root) return;
    // querySelector escaping is handled by attribute selector quotes;
    // segment keys are dotted decimals so they're safe as-is.
    const target = root.querySelector(`[data-passage-id="${passage.id}"][data-segment="${focusSegment}"]`);
    if (target) {
      target.scrollIntoView({ block: 'center', behavior: 'smooth' });
      target.classList.add('dhamma-seg-active');
      // Drop the flash after a couple of seconds so the segment
      // returns to normal styling.
      const t = setTimeout(() => target.classList.remove('dhamma-seg-active'), 2200);
      clearFocusSegment?.();
      return () => clearTimeout(t);
    }
  }, [focusSegment, passage?.id, clearFocusSegment]);

  // Reader sticky chrome — enabled in the standard reader AND in
  // reading-mode (focus). compact (pinned panel) and split-pane
  // skip the sticky pattern because they don't have the room.
  const stickyEnabled = !(compact || inSplitPane);

  // Auto-hiding reader chrome. While reading (scrolling down) the sticky
  // header slides up out of the way so it never ghosts over or covers the
  // text; a deliberate up-scroll brings it back. Applied via direct DOM
  // writes on a rAF-throttled scroll listener, NOT React state — an earlier
  // useState-backed `headerProgress` re-rendered this ~1700-line component
  // every animation frame and stuttered scroll on mobile.
  //
  // Why transform, not opacity: the bar is position:sticky, so its box stays
  // pinned at the top. Fading it only makes the text scroll THROUGH a ghosted
  // bar (the old behaviour, and the bug being fixed). translateY(-100%) moves
  // the bar fully off the top edge, so that strip shows the text instead of
  // covering it. Revealing is direction- AND distance-gated: it returns only
  // after the user scrolls up a meaningful amount (accUp > UP_REVEAL), so
  // momentum jitter or a one-line nudge does not flash it back; near the very
  // top it is always shown. accUp/accDown reset on each direction change, so
  // only *sustained* up-scroll counts as intentional.
  const stickyRef = useRef(null);
  useEffect(() => {
    if (!stickyEnabled) return;
    const TOP_ALWAYS_SHOW = 24;   // within this of the top: always visible
    const HIDE_AFTER = 72;        // don't begin hiding until scrolled past this
    const DOWN_HIDE = 10;         // committed down-scroll (px) that hides it
    const UP_REVEAL = 56;         // accumulated up-scroll (px) that reveals it
    let scrollEl = null;
    let rafId = 0;
    let lastY = 0;
    let accUp = 0;
    let accDown = 0;
    let shown = true;

    function applyShown(s) {
      const el = stickyRef.current;
      if (!el) return;
      el.style.transform = s ? 'translateY(0)' : 'translateY(-100%)';
      el.style.pointerEvents = s ? 'auto' : 'none';
    }
    function setShown(s) {
      if (s === shown) return;
      shown = s;
      applyShown(s);
    }

    function compute() {
      rafId = 0;
      if (!scrollEl) return;
      const y = scrollEl.scrollTop;
      const dy = y - lastY;
      lastY = y;
      const maxScroll = scrollEl.scrollHeight - scrollEl.clientHeight;
      // Nothing meaningful to scroll, or sitting at the top: always show.
      if (maxScroll < 50 || y <= TOP_ALWAYS_SHOW) { accUp = 0; accDown = 0; setShown(true); return; }
      if (dy > 0) {            // scrolling down -> get out of the way
        accDown += dy; accUp = 0;
        if (y > HIDE_AFTER && accDown > DOWN_HIDE) setShown(false);
      } else if (dy < 0) {     // scrolling up -> reveal only on intent
        accUp += -dy; accDown = 0;
        if (accUp > UP_REVEAL) setShown(true);
      }
    }

    function onScroll() {
      if (rafId) return;
      rafId = requestAnimationFrame(compute);
    }

    function attach() {
      const el = document.querySelector('[data-scroll-root]');
      if (el === scrollEl) return;
      if (scrollEl) scrollEl.removeEventListener('scroll', onScroll);
      scrollEl = el;
      if (scrollEl) {
        scrollEl.addEventListener('scroll', onScroll, { passive: true });
        lastY = scrollEl.scrollTop;
        accUp = 0; accDown = 0;
        shown = false;         // force the first applyShown to run
        setShown(true);
      }
    }

    attach();
    const observer = new MutationObserver(() => attach());
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (scrollEl) scrollEl.removeEventListener('scroll', onScroll);
      observer.disconnect();
    };
  }, [stickyEnabled]);

  // Flat depth-first order across the whole canon — adjacent nav crosses
  // work / canon boundaries so a reader can trace a concept end-to-end.
  // Filter out CST mūla volume-header uddāna passages — they're
  // mnemonic verses, not content readers want to step through. The
  // individual suttas (..._1, _2, …) stay in the chain.
  const isUddanaId = (id) => /^cst-[a-z0-9]+m\.mul-(dn|mn|sn|an|kn)\d+$/i.test(id);
  const allLeaves = useMemo(
    () => collectLeaves(tree).filter((n) => !isUddanaId(n.id)),
    [tree]
  );
  // Paragraph-grouped navigation: after the 2026-05 per-<p> CST
  // subdivision, fine commentary rows are ~5-30x as numerous as before.
  // groupLeaves collapses consecutive paragraph-rows that share a
  // parent xml_div_id into one logical "page" so prev/next operates
  // on those pages instead of individual paragraphs (which would
  // require hundreds of clicks to traverse one sutta-commentary).
  // Non-fine leaves (canonical mula, anya, library articles) are
  // each their own singleton group — same behaviour as before.
  const groups = useMemo(() => groupLeaves(allLeaves), [allLeaves]);
  const groupCtx = leafId ? findGroupContext(groups, leafId) : null;
  const prev = groupCtx?.prevGroup ? groupCtx.prevGroup.items[0] : null;
  const next = groupCtx?.nextGroup ? groupCtx.nextGroup.items[0] : null;

  // Derive display labels from the corpus tree (server gives us work_slug)
  const workInfo = workBySlug?.get(passage.work_slug);
  const traditionLabel = workInfo?.tradition || '';
  const workLabel = workInfo?.name || '';

  // Multi-translator support: fetch all translations for this passage,
  // let the reader switch between Sujato (default), Thanissaro, etc.
  // The fetched list is ordered by curated position (sujato=0,
  // thanissaro=10, …); first item is the default selection.
  //
  // For merged paragraph groups (Step 2), we fetch translations across
  // the ENTIRE group instead of just the anchor — Tier 2 Bodhi
  // commentary anchors translation rows to specific paragraph anchors
  // scattered through the group, so an anchor-only fetch would miss
  // them. The bulk endpoint returns per-row translations; we groupBy
  // translator and concatenate per-row text in group order so the
  // dropdown shows a unified "Bodhi" view that spans the whole group.
  const [translations, setTranslations] = useState(null);
  const [selectedTranslator, setSelectedTranslator] = useState(null);
  // Always fetch translations via the group endpoint keyed on the
  // anchor passage id. The server returns the anchor's own row for
  // singletons (paragraphGroupId is null) and the per-row rows for
  // fine paragraph groups. Keying on anchorPassage.id (not the
  // derived merged passage.id, which is the same anyway) keeps this
  // effect from re-firing when the group merge resolves, which
  // would otherwise blank out the active translation for a beat
  // and make English flicker off mid-load.
  useEffect(() => {
    if (!anchorPassage?.id) return;
    setTranslations(null);
    setSelectedTranslator(null);
    const ac = new AbortController();
    passageGroupTranslationsApi(anchorPassage.id, { signal: ac.signal })
      .then((r) => {
        // Group per-row rows by translator+source, concatenate
        // text in source order (the server already returns rows
        // ordered by group position). One unified row per (
        // translator, source) pair: this lets a "bodhi" pick
        // surface all his per-anchor commentary translations
        // concatenated in reading order. For singletons the
        // group is just the anchor so this collapses to the
        // single-passage shape.
        const byKey = new Map();
        for (const t of r.translations || []) {
          const key = `${t.translator}::${t.source}`;
          if (!byKey.has(key)) {
            byKey.set(key, {
              translator: t.translator,
              source: t.source,
              texts: [],
              license: t.license,
              source_book: t.source_book,
              source_url: t.source_url,
            });
          }
          byKey.get(key).texts.push(t.text);
        }
        const merged = [...byKey.values()].map((g) => ({
          translator: g.translator,
          source: g.source,
          text: g.texts.join('\n\n'),
          license: g.license,
          source_book: g.source_book,
          source_url: g.source_url,
        }));
        setTranslations(merged);
        if (merged.length) setSelectedTranslator(merged[0].translator);
      })
      .catch(() => { /* fall through to passage.translation */ });
    return () => ac.abort();
  }, [anchorPassage?.id]);

  const activeTranslation = translations?.find((t) => t.translator === selectedTranslator);
  const translationText = activeTranslation?.text || passage.translation;
  const translationIsHtml = activeTranslation && activeTranslation.source === 'ati';

  // Parallels from SuttaCentral's parallels.json — fetched per passage.
  // Targets carry parallel_have=true when in our corpus (clickable);
  // others are external (e.g. Sanskrit/Chinese parallels) and render
  // as plain text. Grouped by relation type so the scholar can scan
  // direct parallels vs. mentions vs. retells separately.
  const [parallels, setParallels] = useState(null);
  // Sutta → commentary jump. For a canonical mūla sutta, the server
  // returns its CST Aṭṭhakathā + Ṭīkā sections; we render a "Commentary"
  // section mirroring "Parallels", with each entry opening that
  // commentary passage in the reader. Empty arrays come back when the
  // passage has no commentary or is itself commentary, so the section
  // hides automatically.
  const [commentary, setCommentary] = useState(null);
  const [citeCopied, setCiteCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const { has: isBookmarked, toggle: toggleBookmark } = useBookmarks();
  const { create: createNote, forPassage: notesForPassage } = useNotes();
  // Notes attached to this passage. Sorted newest-first by useNotes;
  // we slice down to ranges (for the in-passage markers) + count (for
  // the header badge). Both are cheap on a per-passage scale.
  const passageNotes = notesForPassage(passage?.id);
  const noteRanges = passageNotes
    .filter((n) => n.startKey && n.endKey)
    .map((n) => ({ startKey: n.startKey, endKey: n.endKey }));
  const isNarrow = useIsNarrow();
  // Narrow viewports: 7 header icons (bookmark, cite, pin, gloss,
  // reading-mode, SC↗) wrapped awkwardly. Collapse into a "…" menu.
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);
  const moreMenuRef = useRef(null);
  useEffect(() => {
    if (!moreOpen) return;
    const onDown = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setMoreOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [moreOpen]);
  // WAI-ARIA menu-button pattern: when the overflow menu opens, move
  // focus to its first item; arrow/Home/End rove between items; Escape
  // (handled below) returns focus to the trigger.
  useEffect(() => {
    if (!moreOpen) return;
    moreMenuRef.current?.querySelector('[role="menuitem"]')?.focus();
  }, [moreOpen]);
  const onMenuKeyDown = (e) => {
    const items = [...(moreMenuRef.current?.querySelectorAll('[role="menuitem"]') || [])];
    if (!items.length) return;
    const idx = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      items[idx >= items.length - 1 ? 0 : idx + 1].focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      items[idx <= 0 ? items.length - 1 : idx - 1].focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      items[0].focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      items[items.length - 1].focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setMoreOpen(false);
      // The trigger button node is re-created when the menu unmounts, so a
      // held ref goes stale (disconnected) — re-query the live node from the
      // stable container after the commit so focus is not dropped on <body>.
      setTimeout(() => moreRef.current?.querySelector('button[aria-label="Passage actions"]')?.focus(), 0);
    } else if (e.key === 'Tab') {
      setMoreOpen(false);
    }
  };
  // Close the menu when the passage changes (navigating prev/next).
  useEffect(() => { setMoreOpen(false); }, [passage?.id]);
  // Narrow viewports: user picks one column at a time. Default to
  // English when a translation exists, Pali otherwise. Reset when the
  // passage changes.
  const [mobileColumn, setMobileColumn] = useState('pali');
  useEffect(() => {
    setMobileColumn(passage.translation || passage.original ? 'english' : 'pali');
  }, [passage?.id]);
  // Desktop column-display preference. 'both' = side-by-side (default),
  // 'pali' = Pāli only, 'english' = English only. Persists across the
  // session via localStorage; many scholars don't read Pāli at all and
  // get a less-cluttered view by hiding it.
  const [columnMode, setColumnModeRaw] = useState(() => {
    if (typeof window === 'undefined') return 'both';
    try {
      const v = window.localStorage.getItem('dhamma:columnMode');
      return v === 'pali' || v === 'english' || v === 'both' ? v : 'both';
    } catch { return 'both'; }
  });
  const setColumnMode = (v) => {
    setColumnModeRaw(v);
    try { window.localStorage.setItem('dhamma:columnMode', v); } catch {/* */}
  };
  useEffect(() => {
    if (!passage?.id) return;
    setParallels(null);
    const ac = new AbortController();
    passageParallelsApi(passage.id, { signal: ac.signal })
      .then((r) => setParallels(r.parallels || []))
      .catch(() => setParallels([]));
    return () => ac.abort();
  }, [passage?.id]);

  // Commentary fetch — keyed on the anchor passage id (the mūla sutta
  // being read). The server returns empty arrays for non-mūla / no-
  // commentary passages, so the section self-hides.
  useEffect(() => {
    if (!passage?.id) { setCommentary(null); return; }
    setCommentary(null);
    const ac = new AbortController();
    passageCommentaryApi(passage.id, { signal: ac.signal })
      .then((r) => setCommentary(r))
      .catch(() => setCommentary({ attha: [], tika: [] }));
    return () => ac.abort();
  }, [passage?.id]);

  // Interlinear glosses — Pali words become hoverable, tooltip shows
  // the DPD/PED headword + short definition. Off by default to avoid
  // visual noise; toggled in the reader header.
  const [glossesOn, setGlossesOn] = useState(false);
  const [glossMap, setGlossMap] = useState(null);
  // Interlinear mode — distinct from the lighter hover-tooltip gloss
  // above. When on, the Pāli column renders word-by-word with the DPD
  // gloss stacked beneath each word (InterlinearGloss component). Off
  // by default; the two gloss modes are mutually exclusive (turning one
  // on clears the other) since both annotate the same Pāli column.
  const [interlinearOn, setInterlinearOn] = useState(false);
  useEffect(() => {
    if (!glossesOn || !passage.original) { setGlossMap(null); return; }
    // Tokenize: any Unicode letter run (covers Pali diacritics)
    const words = Array.from(new Set(
      passage.original.toLowerCase().match(/\p{L}+/giu) || []
    )).slice(0, 200);
    if (words.length === 0) return;
    const ac = new AbortController();
    glossApi(words, { signal: ac.signal })
      .then((r) => setGlossMap(r.glosses || {}))
      .catch(() => setGlossMap({}));
    return () => ac.abort();
  }, [glossesOn, passage.original]);

  // Curated tags from ATI's index-*.html (similes / names / subjects /
  // numbers). Shown as small chips below the body — instant orientation
  // for "what is this sutta known for in scholarly literature."
  const [tags, setTags] = useState(null);
  useEffect(() => {
    if (!passage?.id) return;
    setTags(null);
    const ac = new AbortController();
    passageTagsApi(passage.id, { signal: ac.signal })
      .then((r) => setTags(r.tags || []))
      .catch(() => setTags([]));
    return () => ac.abort();
  }, [passage?.id]);

  const tagsByType = useMemo(() => {
    const m = new Map();
    for (const t of tags || []) {
      if (!m.has(t.tag_type)) m.set(t.tag_type, []);
      m.get(t.tag_type).push(t);
    }
    return m;
  }, [tags]);

  const parallelsByType = useMemo(() => {
    const m = new Map();
    for (const p of parallels || []) {
      if (!m.has(p.relation_type)) m.set(p.relation_type, []);
      m.get(p.relation_type).push(p);
    }
    return m;
  }, [parallels]);

  // Commentary layers, in display order: aṭṭhakathā first, then ṭīkā.
  // Each is [label, list]; empty layers are dropped so the section only
  // renders the layers that actually have entries.
  const commentaryLayers = useMemo(() => {
    if (!commentary) return [];
    const out = [];
    if (commentary.attha?.length) out.push(['aṭṭhakathā', commentary.attha]);
    if (commentary.tika?.length) out.push(['ṭīkā', commentary.tika]);
    return out;
  }, [commentary]);

  // In-passage find. Two modes:
  //   exact (default) — literal substring, case-insensitive
  //   stem            — Pali inflection bridging via paliStem(),
  //                     so "sati" catches "satiyā", "satimā", etc.
  // Highlights apply to Pali (always) and plain-text translation;
  // ATI HTML translations bypass to avoid regex-on-HTML breakage.
  const [findText, setFindText] = useState('');
  const [findStem, setFindStem] = useState(false);
  const [findFocused, setFindFocused] = useState(false);
  const findInputRef = useRef(null);
  const findBlurTimerRef = useRef(null);
  useEffect(() => { setFindText(''); setFindStem(false); }, [passage?.id]);
  function handleFindFocus() {
    if (findBlurTimerRef.current) clearTimeout(findBlurTimerRef.current);
    setFindFocused(true);
  }
  function handleFindBlur() {
    findBlurTimerRef.current = setTimeout(() => setFindFocused(false), 120);
  }
  function insertFindChar(ch) {
    if (findBlurTimerRef.current) clearTimeout(findBlurTimerRef.current);
    const el = findInputRef.current;
    if (!el) { setFindText((t) => t + ch); return; }
    const start = el.selectionStart ?? findText.length;
    const end = el.selectionEnd ?? findText.length;
    const next = findText.slice(0, start) + ch + findText.slice(end);
    setFindText(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + ch.length;
      el.setSelectionRange(pos, pos);
    });
  }
  const findStripped = findText.trim();
  // Effective highlight: user-typed find term wins; otherwise fall back to
  // the search-context highlightTerms array passed in by the parent. Lets
  // a passage opened from a search hit auto-highlight every occurrence
  // of the matched terms (alias-expanded), and still gives the user a
  // way to override by typing their own find term.
  const userTypedFind = findStripped.length > 0;
  const activeHighlight = userTypedFind
    ? findStripped
    : (Array.isArray(highlightTerms) && highlightTerms.length > 0 ? highlightTerms : null);
  const activeStem = userTypedFind ? findStem : !!highlightStem;
  const matchCount = useMemo(() => {
    if (!activeHighlight) return 0;
    const terms = Array.isArray(activeHighlight) ? activeHighlight : [activeHighlight];
    if (activeStem) {
      const stems = new Set(terms.map((t) => paliStem(String(t).toLowerCase())).filter(Boolean));
      if (stems.size === 0) return 0;
      let count = 0;
      const re = /\p{L}+/giu;
      if (passage.original) {
        const ws = passage.original.match(re) || [];
        for (const w of ws) if (stems.has(paliStem(w.toLowerCase()))) count++;
      }
      if (translationText && !translationIsHtml) {
        const ws = translationText.match(re) || [];
        for (const w of ws) if (stems.has(paliStem(w.toLowerCase()))) count++;
      }
      return count;
    }
    const re = new RegExp(terms.map(escapeRegExp).join('|'), 'giu');
    let count = 0;
    if (passage.original) count += (passage.original.match(re) || []).length;
    if (translationText && !translationIsHtml) count += (translationText.match(re) || []).length;
    return count;
  }, [activeHighlight, activeStem, passage.original, translationText, translationIsHtml]);

  // When both Pali + English exist, drop the single-column reading-width
  // cap so the parallel reader can span the full available content area.
  const hasParallel = !!(passage.original && passage.translation);
  const articleStyle = compact
    ? { ...reading, padding: '12px 0 8px', maxWidth: hasParallel ? '100%' : reading.maxWidth }
    : { ...reading, maxWidth: hasParallel ? '100%' : reading.maxWidth };

  // Sticky reader chrome: wraps the prev/next nav, citation header,
  // contextual banners, translator chips, and find-in-passage row in
  // one collapsible element. The hook above drives a 0→1 progress
  // value that the style consumes via maxHeight + opacity, so the
  // chrome shrinks smoothly as the user scrolls down and re-expands
  // when they scroll back near the top. When stickyEnabled is false
  // (compact/reading-mode/split-pane) we render the inner JSX in
  // place without any wrap styling.
  // Sticky reader chrome — fully visible in initial render. The
  // useEffect above mutates opacity + pointer-events via stickyRef
  // as the user scrolls, so React never re-renders this component
  // during scroll.
  const stickyWrapStyle = stickyEnabled ? {
    position: 'sticky',
    top: 0,
    zIndex: 20,
    marginLeft: -28,
    marginRight: -28,
    paddingLeft: 28,
    paddingRight: 28,
    paddingTop: 14,
    paddingBottom: 4,
    background: 'var(--bc-bg-base)',
    borderBottom: '1px solid rgba(var(--bc-accent-rgb), 0.22)',
    // Auto-hide via transform (not opacity): the useEffect writes
    // translateY(0 | -100%) + pointer-events on each rAF-throttled scroll
    // frame. Transform keeps the bar opaque and slides it off the top strip
    // instead of ghosting it over the text. willChange/transition keep the
    // slide GPU-composited and smooth without re-rendering React.
    transform: 'translateY(0)',
    transition: 'transform 180ms ease',
    willChange: 'transform',
    pointerEvents: 'auto',
  } : undefined;

  return (
    <article ref={ref} style={articleStyle}>
      <div ref={stickyRef} style={stickyWrapStyle}>
        {/* Back affordance. In the standard reader this exits to the
            canon drill; in reading-mode (focus) it exits the focus
            view. On mobile in the standard reader we hide it because
            the OS/browser back gesture covers it — but in reading
            mode there's no route to back out of, so the explicit
            button is the only way out, and it shows on every viewport. */}
        {stickyEnabled && onBack && (readingMode || !isNarrow) && (
          <button
            onClick={onBack}
            style={{ ...backBtn, marginBottom: 8 }}
            aria-label={readingMode ? 'Exit reading mode (Esc)' : 'Back to canon (Esc)'}
          >
            <span aria-hidden="true" style={{ fontSize: 16 }}>←</span>
            <span>{readingMode ? 'Exit reading mode' : 'Back to canon'}</span>
            <span style={backBtnHint}>Esc</span>
          </button>
        )}
      {!compact && (
        <nav style={navRow}>
          {prev ? (
            <a
              href={`#/read/${encodeURIComponent(prev.id)}`}
              onClick={(e) => {
                if (isModifiedClick(e)) return;
                e.preventDefault();
                onNavigate?.(prev.id);
              }}
              style={{ ...navBtn, ...navBtnLinkReset }}
            >
              <span style={navArrow}>◀</span>
              <span style={navLabel}>
                <span style={navName}>{prev.name}</span>
                {prev.subtitle && <span style={navSubtitle}>{prev.subtitle}</span>}
              </span>
            </a>
          ) : <span />}
          {next ? (
            <a
              href={`#/read/${encodeURIComponent(next.id)}`}
              onClick={(e) => {
                if (isModifiedClick(e)) return;
                e.preventDefault();
                onNavigate?.(next.id);
              }}
              style={{ ...navBtn, ...navBtnLinkReset, textAlign: 'right' }}
            >
              <span style={navLabel}>
                <span style={navName}>{next.name}</span>
                {next.subtitle && <span style={navSubtitle}>{next.subtitle}</span>}
              </span>
              <span style={navArrow}>▶</span>
            </a>
          ) : <span />}
        </nav>
      )}

      <header style={readingHeader}>
       {/* Identity row: citation + the full title. The title is never
           truncated; the toolbar (find + action icons) sits on the line
           below, so a long Pāli/commentary title keeps its own width. */}
       <div style={citationTitleRow}>
        <span style={readingCitation}>
          {displayCitation(passage.citation, workLabel)}
          {passageNotes.length > 0 && (
            <span style={notesCountBadge} title={`${passageNotes.length} note${passageNotes.length === 1 ? '' : 's'} on this passage`}>
              {passageNotes.length} note{passageNotes.length === 1 ? '' : 's'}
            </span>
          )}
        </span>
        {(passage.title || passage.title_en || workLabel) && (
          <span style={citationTitleText}>
            {(passage.title || passage.title_en) ? (
              <>
                {passage.title && <span style={readingTitlePali}>{passage.title}</span>}
                {passage.title && passage.title_en && <span style={readingTitleSep}> · </span>}
                {passage.title_en && <span style={readingTitleEn}>{passage.title_en}</span>}
                {workLabel && <> &nbsp;·&nbsp; <span style={readingWorkContext}>{workLabel}</span></>}
              </>
            ) : workLabel}
          </span>
        )}
       </div>
       {/* Toolbar row: find-in-passage on the left, action icons on the
           right, one line. Find collapses to a <span/> placeholder in
           compact panes; the icon block (unchanged) returns null there. */}
       <div style={readingHeaderRow}>
        {!compact ? (
          <div style={findRowInline}>
            <input
              ref={findInputRef}
              type="search"
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
              onFocus={handleFindFocus}
              onBlur={handleFindBlur}
              placeholder={
                !userTypedFind && Array.isArray(highlightTerms) && highlightTerms.length > 0
                  ? `Highlighting ${highlightTerms.slice(0, 3).join(', ')}${highlightTerms.length > 3 ? '…' : ''} — type to override`
                  : 'Find in passage…'
              }
              style={findInput}
              spellCheck={false}
              aria-label="Find in passage"
            />
            <button
              onClick={() => setFindStem((v) => !v)}
              style={{
                ...findStemBtn,
                color: findStem ? 'var(--bc-accent)' : 'var(--bc-text-tertiary)',
                borderColor: findStem ? 'var(--bc-accent)' : 'rgba(var(--bc-accent-rgb), 0.18)',
              }}
              title={findStem ? 'Stem mode (sati → satiyā, satimā…). Click for literal.' : 'Switch to stem mode — Pali inflection bridging.'}
              aria-pressed={findStem}
            >
              Stem
            </button>
            {activeHighlight && (
              <span style={findCount}>
                {matchCount.toLocaleString()} {matchCount === 1 ? 'match' : 'matches'}
                {isLongGroup && !showAll ? ' on this page' : ''}
              </span>
            )}
          </div>
        ) : <span />}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, position: 'relative' }} ref={moreRef}>
          {(() => {
            if (compact) {
              // Tradition label retired (only Theravāda is live) — pinned
              // pane now has no kicker on the right. Restore the chip if
              // cross-tradition data lands.
              return null;
            }
            // Build the action list once; render expanded on wide
            // viewports, collapsed into a "…" menu on narrow.
            const actions = [];
            actions.push({
              key: 'bookmark',
              // Marked primary: stays inline even on narrow viewports.
              // Bookmarking is one of the two most-used reader actions
              // on mobile, so it doesn't belong hidden behind a "…".
              primary: true,
              label: isBookmarked(leafId) ? 'Remove bookmark' : 'Bookmark passage',
              active: isBookmarked(leafId),
              onClick: () => toggleBookmark({ id: leafId, citation: passage.citation, title: passage.title, work: workLabel }),
              icon: isBookmarked(leafId) ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true" focusable="false"><path d="M6 2h12a1 1 0 0 1 1 1v19l-7-4-7 4V3a1 1 0 0 1 1-1z"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M19 21l-7-4-7 4V3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1z"/></svg>
              ),
            });
            actions.push({
              key: 'cite',
              label: citeCopied ? 'Citation copied' : 'Copy citation',
              onClick: async () => {
                try {
                  await navigator.clipboard.writeText(formatCitation(
                    { ...passage, translation: translationText, work: workLabel, tradition: traditionLabel },
                    { translatorName: selectedTranslator ? (TRANSLATOR_LABEL[selectedTranslator] || selectedTranslator) : undefined },
                  ));
                  setCiteCopied(true);
                  setTimeout(() => setCiteCopied(false), 1400);
                } catch {/* ignore */}
              },
              icon: citeCopied ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><polyline points="20 6 9 17 4 12"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>
              ),
            });
            // Share: on devices with the Web Share API (most mobile +
            // some desktop), opens the native share sheet — handy for
            // sending a passage to a friend, posting, dropping into
            // notes, etc. Falls back to copying the canonical URL to
            // the clipboard everywhere else. Either way the user gets
            // brief "Link copied" / "Shared" feedback via the
            // checkmark icon swap.
            actions.push({
              key: 'share',
              // Primary on narrow: share is the highest-value mobile
              // action (native share sheet on iOS / Android). User
              // explicitly asked for it to be visible in the header,
              // not buried in the overflow dropdown.
              primary: true,
              label: shareCopied ? 'Link copied' : 'Share passage',
              onClick: async () => {
                const shareUrl = `${window.location.origin}/#/read/${encodeURIComponent(passage.id)}`;
                const shareData = {
                  title: `${passage.citation || passage.id} — Dhamma data`,
                  text: passage.title ? `${passage.citation} · ${passage.title}` : passage.citation || passage.id,
                  url: shareUrl,
                };
                try {
                  if (navigator.share && navigator.canShare?.(shareData)) {
                    await navigator.share(shareData);
                    // The native sheet handles its own confirmation;
                    // no extra UI feedback needed.
                  } else {
                    await navigator.clipboard.writeText(shareUrl);
                    setShareCopied(true);
                    setTimeout(() => setShareCopied(false), 1400);
                  }
                } catch {/* user cancelled / clipboard blocked */}
              },
              icon: shareCopied ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><polyline points="20 6 9 17 4 12"/></svg>
              ) : (
                // Share-node glyph: three connected dots (source +
                // two destinations) with line links between. Reads
                // as "share" across iOS, Android, and desktop muscle
                // memory better than the arrow-out-of-box variant.
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.6" y1="10.5" x2="15.4" y2="6.5" />
                  <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
                </svg>
              ),
            });
            if (!inSplitPane) {
              actions.push({
                key: 'pin',
                label: isPinned ? 'Unpin from top' : 'Pin to top',
                active: isPinned,
                onClick: () => setPinnedLeafId?.(isPinned ? null : leafId),
                icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={isPinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M16 4l4 4-6 6v6l-2 2-4-4v-4l-6-6 4-4z"/></svg>
                ),
              });
            }
            if (passage.original) {
              actions.push({
                key: 'gloss',
                label: glossesOn ? 'Hide word glosses' : 'Show word glosses (DPD)',
                active: glossesOn,
                onClick: () => setGlossesOn((v) => {
                  const next = !v;
                  if (next) setInterlinearOn(false); // mutually exclusive
                  return next;
                }),
                icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                    <path d="M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2"/>
                    <path d="M12 4v16"/>
                    <path d="M8 20h8"/>
                  </svg>
                ),
              });
              // Interlinear mode — stacked Pāli + DPD gloss per word.
              // Heavier than the hover gloss, so it's a separate toggle.
              actions.push({
                key: 'interlinear',
                label: interlinearOn ? 'Hide interlinear gloss' : 'Interlinear gloss (DPD)',
                active: interlinearOn,
                onClick: () => setInterlinearOn((v) => {
                  const next = !v;
                  if (next) setGlossesOn(false); // mutually exclusive
                  return next;
                }),
                icon: (
                  // Two stacked lines (word over gloss) inside a frame —
                  // reads as "text with annotation beneath".
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                    <line x1="4" y1="8" x2="20" y2="8"/>
                    <line x1="7" y1="13" x2="17" y2="13"/>
                    <line x1="4" y1="18" x2="20" y2="18"/>
                    <line x1="7" y1="22" x2="17" y2="22" opacity="0.5"/>
                  </svg>
                ),
              });
            }
            // Column-mode toggle. Only meaningful when both columns
            // exist and we're on a wide viewport (narrow has its own
            // tab toggle). Cycles Both → Pāli → English → Both. The
            // label encodes the CURRENT state so the user sees what's
            // showing; the icon shows two-or-one columns.
            if (passage.original && translationText && !isNarrow) {
              const nextMode = columnMode === 'both' ? 'pali' : columnMode === 'pali' ? 'english' : 'both';
              const modeLabel = columnMode === 'both' ? 'Both columns' : columnMode === 'pali' ? 'Pāli only' : 'English only';
              actions.push({
                key: 'col',
                label: `${modeLabel}, click to switch`,
                active: columnMode !== 'both',
                onClick: () => setColumnMode(nextMode),
                icon: columnMode === 'both' ? (
                  // Two columns side by side
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                    <rect x="3" y="4" width="7" height="16" rx="1"/>
                    <rect x="14" y="4" width="7" height="16" rx="1"/>
                  </svg>
                ) : columnMode === 'pali' ? (
                  // Single column with a small "P" marker
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                    <rect x="6" y="4" width="12" height="16" rx="1"/>
                    <text x="12" y="15" textAnchor="middle" fontSize="9" stroke="none" fill="currentColor" fontFamily="serif">P</text>
                  </svg>
                ) : (
                  // Single column with a small "E" marker
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                    <rect x="6" y="4" width="12" height="16" rx="1"/>
                    <text x="12" y="15" textAnchor="middle" fontSize="9" stroke="none" fill="currentColor" fontFamily="serif">E</text>
                  </svg>
                ),
              });
            }
            if (!readingMode) {
              actions.push({
                key: 'reading',
                label: 'Reading mode (focus)',
                onClick: () => setReadingMode?.(true),
                icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                    <path d="M3 7V3h4M21 7V3h-4M3 17v4h4M21 17v4h-4" />
                  </svg>
                ),
              });
            }
            // SuttaCentral outbound: only available for non-CST IDs.
            // Inline as a styled link on wide; rendered as a menu row
            // (still an anchor) on narrow so target='_blank' is preserved.
            if (!passage.id?.startsWith('cst-')) {
              actions.push({
                key: 'sc',
                label: 'View on SuttaCentral',
                href: `https://suttacentral.net/${passage.id}`,
                icon: <span style={{ fontWeight: 600, letterSpacing: '0.14em', fontSize: 11 }}>SC ↗</span>,
              });
            }

            // Helper: render one action as its inline icon button.
            const renderIcon = (a) => {
              if (a.href) {
                return (
                  <a key={a.key} href={a.href} target="_blank" rel="noopener noreferrer" style={scLink} title={a.label}>
                    SC ↗
                  </a>
                );
              }
              const style = a.active ? {
                ...iconAction,
                color: 'var(--bc-accent)',
                borderColor: 'var(--bc-accent)',
              } : iconAction;
              return (
                <button key={a.key} onClick={a.onClick} style={style} title={a.label} aria-label={a.label} aria-pressed={a.active || undefined}>
                  {a.icon}
                </button>
              );
            };

            // Tradition badge intentionally not rendered here. The
            // entire corpus is Theravāda right now; the badge was
            // dead weight. When Mahāyāna/Zen come online, restore
            // <div style={readingTradition}>{traditionLabel}</div>.

            if (!isNarrow) {
              return <>{actions.map(renderIcon)}</>;
            }

            // Narrow viewport: actions marked primary render inline,
            // the rest collapse into a "…" dropdown so the header
            // never overflows the screen edge. User explicitly
            // requested Share + Bookmark stay visible inline.
            const primary  = actions.filter((a) => a.primary);
            const overflow = actions.filter((a) => !a.primary);
            return (
              <>
                {primary.map(renderIcon)}
                {overflow.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setMoreOpen((v) => !v)}
                    style={iconAction}
                    aria-label="Passage actions"
                    aria-haspopup="menu"
                    aria-expanded={moreOpen}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>
                  </button>
                )}
                {moreOpen && (
                  <div ref={moreMenuRef} role="menu" aria-label="Passage actions" aria-orientation="vertical" onKeyDown={onMenuKeyDown} style={overflowMenu}>
                    {overflow.map((a) => {
                      const common = {
                        role: 'menuitem',
                        tabIndex: -1,
                        style: { ...overflowItem, ...(a.active ? overflowItemActive : null) },
                      };
                      if (a.href) {
                        return (
                          <a key={a.key} {...common} href={a.href} target="_blank" rel="noopener noreferrer" onClick={() => setMoreOpen(false)}>
                            <span style={overflowItemIcon}>{a.icon}</span>
                            <span>{a.label}</span>
                          </a>
                        );
                      }
                      return (
                        <button
                          key={a.key}
                          type="button"
                          {...common}
                          onClick={() => { a.onClick?.(); setMoreOpen(false); }}
                        >
                          <span style={overflowItemIcon}>{a.icon}</span>
                          <span>{a.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            );
          })()}
        </div>
       </div>
        {/* Diacritic inserter, shown under the toolbar while the find field
            is focused (it cannot sit inside the flex toolbar row). */}
        {!compact && findFocused && (
          <div style={findDiacriticsRow} aria-label="Insert Pali diacritic">
            {FIND_DIACRITICS.map((ch) => (
              <button
                key={ch}
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (findBlurTimerRef.current) clearTimeout(findBlurTimerRef.current);
                }}
                onClick={() => insertFindChar(ch)}
                style={findDiacriticBtn}
                title={`Insert ${ch}`}
              >
                {ch}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* CST mūla volume headers are uddāna (closing mnemonic) entries —
          tiny passages (~140 chars) that list the suttas in the vagga
          but aren't the suttas themselves. Pattern: cst-...m.mul-<nik>N
          with no underscore (the individual suttas use ..._1, _2, …).
          Banner explains what they are + points at the readable suttas.

          Non-uddāna CST mūla passages without English get a simpler
          banner noting the missing translation. */}
      {(() => {
        if (compact) return null;
        const id = passage.id || '';
        const cstMulaMatch = id.match(/^cst-[a-z0-9]+m\.mul-(dn|mn|sn|an|kn)\d+(_\d+)?$/i);
        if (!cstMulaMatch) return null;
        // Uddāna: matches the volume-header pattern (no _N suffix) AND
        // body is short — both signals together so a pathological short
        // SC sutta doesn't trigger.
        const isUddana = !cstMulaMatch[2] && (passage.original || '').length < 500;
        if (!isUddana && translationText) return null;  // ordinary CST mūla with translation: no banner
        const nikaya = cstMulaMatch[1].toLowerCase();
        return (
          <div style={cstMulaBanner}>
            <span style={cstMulaBannerIcon} aria-hidden="true">ⓘ</span>
            <span style={cstMulaBannerText}>
              {isUddana ? (
                <>
                  This is the closing <em>uddāna</em> — a mnemonic verse
                  listing the suttas in this vagga, not the suttas
                  themselves. To read the individual suttas with English
                  translations,{' '}
                </>
              ) : (
                <>
                  This is the CST mūla edition with no English
                  translation in the corpus. For the canonical
                  individual suttas (which carry Sujato / Thanissaro /
                  others),{' '}
                </>
              )}
              <button
                onClick={() => onBrowseToPath?.(['pli-tipitaka', 'pli-sutta', `pli-${nikaya}`])}
                style={cstMulaBannerLink}
              >
                browse the nikāya →
              </button>
            </span>
          </div>
        );
      })()}

      {translations && translations.length > 1 && (
        <div style={translatorChipRow} role="group" aria-label="Choose translator">
          {translations.map((t) => {
            const on = t.translator === selectedTranslator;
            return (
              <button
                key={t.translator + ':' + t.source}
                onClick={() => setSelectedTranslator(t.translator)}
                aria-pressed={on}
                style={{
                  ...translatorChip,
                  color: on ? 'var(--bc-accent)' : 'var(--bc-text-tertiary)',
                  borderColor: on ? 'var(--bc-accent)' : 'rgba(var(--bc-accent-rgb), 0.18)',
                  fontWeight: on ? 600 : 400,
                }}
                title={[
                  TRANSLATOR_LABEL[t.translator] || t.translator,
                  t.source === 'ati' ? '(Access to Insight)' : '(SuttaCentral)',
                  t.copyright,
                ].filter(Boolean).join(' ')}
              >
                {TRANSLATOR_LABEL[t.translator] || t.translator}
                {t.source === 'ati' && <span style={readingAtiBadge}>ATI</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* find-in-passage now lives in the header toolbar row (with the
          action icons); its diacritic popover renders inside the header. */}
      </div>

      {/* Mobile column selector — picks Pali or English instead of the
          cramped side-by-side. Only renders when both columns exist. */}
      {!compact && isNarrow && passage.original && translationText && (
        <div style={columnSwitchRow} role="group" aria-label="Reading column">
          <button
            aria-pressed={mobileColumn === 'pali'}
            onClick={() => setMobileColumn('pali')}
            style={{
              ...columnSwitchBtn,
              color: mobileColumn === 'pali' ? 'var(--bc-accent)' : 'var(--bc-text-tertiary)',
              borderBottomColor: mobileColumn === 'pali' ? 'var(--bc-accent)' : 'transparent',
              fontWeight: mobileColumn === 'pali' ? 600 : 400,
            }}
          >
            Pali
          </button>
          <button
            aria-pressed={mobileColumn === 'english'}
            onClick={() => setMobileColumn('english')}
            style={{
              ...columnSwitchBtn,
              color: mobileColumn === 'english' ? 'var(--bc-accent)' : 'var(--bc-text-tertiary)',
              borderBottomColor: mobileColumn === 'english' ? 'var(--bc-accent)' : 'transparent',
              fontWeight: mobileColumn === 'english' ? 600 : 400,
            }}
          >
            English
          </button>
        </div>
      )}

      {/* Long-commentary navigator: section table-of-contents + paging
          + show-all. Self-hides for singletons and any group that fits
          in a single page (most do). */}
      {!compact && isLongGroup && (
        <div style={groupNavRow} role="group" aria-label="Commentary section navigation">
          {groupNavOptions.length > 1 && (
            <label style={groupNavSelectWrap}>
              <span style={groupNavLabel}>{groupSections.length > 1 ? 'Section' : 'Jump to'}</span>
              <select
                value={groupNavCurrent}
                onChange={(e) => goToGroupIndex(parseInt(e.target.value, 10))}
                style={groupNavSelect}
                aria-label="Jump to section"
              >
                {groupNavOptions.map((o) => (
                  <option key={o.index} value={o.index}>{o.label}</option>
                ))}
              </select>
            </label>
          )}
          <span style={groupNavStatus}>
            {showAll
              ? `All ${groupTotal.toLocaleString()} paragraphs`
              : `Paragraphs ${(groupOffset + 1).toLocaleString()}–${(groupOffset + groupShown).toLocaleString()} of ${groupTotal.toLocaleString()}`}
          </span>
          {!showAll && (
            <span style={groupNavPager}>
              <button
                type="button"
                onClick={groupPrevPage}
                disabled={groupOffset <= 0}
                style={{ ...groupNavBtn, opacity: groupOffset <= 0 ? 0.35 : 1, cursor: groupOffset <= 0 ? 'default' : 'pointer' }}
                aria-label="Previous paragraphs"
              >‹ Prev</button>
              <button
                type="button"
                onClick={groupNextPage}
                disabled={groupOffset + groupShown >= groupTotal}
                style={{ ...groupNavBtn, opacity: groupOffset + groupShown >= groupTotal ? 0.35 : 1, cursor: groupOffset + groupShown >= groupTotal ? 'default' : 'pointer' }}
                aria-label="Next paragraphs"
              >Next ›</button>
            </span>
          )}
          <button type="button" onClick={toggleGroupShowAll} style={groupNavTextBtn}>
            {showAll ? 'Show in pages' : `Show all ${groupTotal.toLocaleString()}`}
          </button>
        </div>
      )}

      {/* Interlinear mode short-circuit. When on (and there's Pāli to
          gloss), the Pāli column renders word-by-word with a DPD gloss
          stacked beneath each word. The side-by-side / SegmentColumn
          machinery below assumes inline prose, so interlinear can't
          slot into it cleanly — instead we render the interlinear Pāli
          block, then the English column underneath when both exist and
          the viewport / column mode would normally show it. Hidden in
          the English-only column mode. */}
      {interlinearOn && passage.original && (
        !isNarrow ? columnMode !== 'english' : mobileColumn !== 'english'
      ) ? (
        <>
          <InterlinearGloss text={passage.original} style={readingOriginal} />
          {translationText && (
            !isNarrow
              ? (columnMode === 'english' || columnMode === 'both')
              : mobileColumn === 'english'
          ) && (
            translationIsHtml
              ? <div style={readingTranslation} dangerouslySetInnerHTML={{ __html: sanitizeDictHtml(translationText) }} />
              : <SegmentColumn
                  passage={passage}
                  language="english"
                  fallback={translationText}
                  findText={activeHighlight}
                  findStem={activeStem}
                  noteRanges={noteRanges}
                  style={readingTranslation}
                />
          )}
        </>
      ) : passage.original && translationText && !isNarrow && columnMode === 'both' ? (
        <SideBySideReader
          passage={passage}
          pali={passage.original}
          english={translationText}
          englishIsHtml={translationIsHtml}
          findText={activeHighlight}
          findStem={activeStem}
          glossMap={glossesOn ? glossMap : null}
          noteRanges={noteRanges}
        />
      ) : (
        <>
          {/* Narrow viewport: one column picked via mobileColumn.
              Wide viewport with columnMode='pali' or 'english':
              one column picked via columnMode. Wide+both falls into
              SideBySideReader above; this branch handles all the
              one-column cases plus the natural fallback when only
              one column actually exists. */}
          {passage.original && (
            !isNarrow
              ? (columnMode === 'pali' || !translationText || columnMode === 'both')
              : (!translationText || mobileColumn === 'pali')
          ) && (
            <SegmentColumn
              passage={passage}
              language="pali"
              fallback={passage.original}
              findText={activeHighlight}
              findStem={activeStem}
              glossMap={glossesOn ? glossMap : null}
              noteRanges={noteRanges}
              style={readingOriginal}
            />
          )}
          {translationText && (
            !isNarrow
              ? (columnMode === 'english' || !passage.original || columnMode === 'both')
              : (!passage.original || mobileColumn === 'english')
          ) && (
            translationIsHtml
              ? <div style={readingTranslation} dangerouslySetInnerHTML={{ __html: sanitizeDictHtml(translationText) }} />
              : <SegmentColumn
                  passage={passage}
                  language="english"
                  fallback={translationText}
                  findText={activeHighlight}
                  findStem={activeStem}
                  noteRanges={noteRanges}
                  style={readingTranslation}
                />
          )}
        </>
      )}

      {/* Translator attribution. Always render when a translation is
          shown, even if it's the only one — when the chip switcher is
          hidden (single translator) the scholar otherwise has no way
          to know who rendered the English. ATI rows carry CC BY-NC 4.0
          and a back-link; SuttaCentral / Sujato is CC0. Bare-passage
          fallback (no translations row) defaults to Sujato since
          that's what the passages table was seeded with. */}
      {translationText && !compact && (() => {
        const t = activeTranslation;
        // ATI: full attribution with copyright + back-link.
        if (t && t.source === 'ati') {
          return (
            <div style={attribFooter}>
              translated by <span style={attribTranslator}>{TRANSLATOR_LABEL[t.translator] || t.translator}</span>
              {' · '}{t.copyright || 'Access to Insight'}{' · '}
              <a href={t.source_url} target="_blank" rel="noopener noreferrer" style={attribLink}>
                CC BY-NC 4.0 · accesstoinsight.org
              </a>
              {t.notes && <span style={attribNotes}> · {t.notes}</span>}
            </div>
          );
        }
        // BPS-direct: Vism (bps-online-free), Bodhi-4 + BP304s + BP502s
        // + BP214s + BP509s + BP501s (bps-fair-use). Attribution shows
        // the source book, the BPS copyright, and a back-link to bps.lk.
        if (t && t.source === 'bps-direct') {
          const licenseLabel = t.license === 'bps-online-free'
            ? 'BPS Online Edition'
            : 'used under fair use, non-commercial scholarly indexing';
          return (
            <div style={attribFooter}>
              translated by <span style={attribTranslator}>{TRANSLATOR_LABEL[t.translator] || t.translator}</span>
              {t.source_book ? <> · {t.source_book}</> : null}
              {' · '}
              <a href={t.source_url} target="_blank" rel="noopener noreferrer" style={attribLink}>
                {licenseLabel} · bps.lk
              </a>
              {t.notes && <span style={attribNotes}> · {t.notes}</span>}
            </div>
          );
        }
        // SuttaCentral row (either an explicit translations entry or
        // the bare passages.translation that defaults to Sujato).
        const translator = t?.translator || 'sujato';
        const url = t?.source_url || `https://suttacentral.net/${passage.id}/en/sujato`;
        return (
          <div style={attribFooter}>
            translated by <span style={attribTranslator}>{TRANSLATOR_LABEL[translator] || translator}</span>
            {' · '}
            <a href={url} target="_blank" rel="noopener noreferrer" style={attribLink}>
              SuttaCentral · CC0
            </a>
          </div>
        );
      })()}

      {tags && tags.length > 0 && !compact && (
        <section style={tagsSection}>
          <h3 style={tagsHeader}>Tagged in ATI indexes</h3>
          {Array.from(tagsByType.entries()).map(([type, list]) => (
            <div key={type} style={tagsTypeRow}>
              <span style={tagsTypeLabel}>{type}</span>
              <span style={tagsList}>
                {list.map((t, i) => (
                  <span key={t.tag_value + i}>
                    <span style={tagChip} title={`${type}: ${t.tag_value}`}>{t.tag_value}</span>
                    {i < list.length - 1 && <span style={tagsSep}>·</span>}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </section>
      )}

      {commentaryLayers.length > 0 && !compact && (
        <section style={parallelsSection}>
          <h3 style={parallelsHeader}>Commentary</h3>
          <p style={parallelsHint}>
            Aṭṭhakathā · ṭīkā for this sutta. Click to open · pin ⤒ to read alongside
          </p>
          {commentaryLayers.map(([layer, list]) => (
            <div key={layer} style={parallelsTypeRow}>
              <span style={parallelsTypeLabel}>{layer}</span>
              <span style={parallelsList}>
                {list.map((cm, i) => (
                  <span key={cm.id + i}>
                    <span style={parallelsItem}>
                      <a
                        href={`#/read/${encodeURIComponent(cm.id)}`}
                        onClick={(e) => {
                          if (isModifiedClick(e)) return;
                          e.preventDefault();
                          onNavigate?.(cm.id);
                        }}
                        style={parallelsLinkBtn}
                        title={cm.snippet || cm.title || cm.citation}
                      >
                        {cm.title || cm.citation}
                      </a>
                      <button
                        onClick={() => setPinnedLeafId?.(cm.id)}
                        style={parallelsPinBtn}
                        title={`Pin ${cm.citation} above to read alongside`}
                        aria-label={`Pin ${cm.citation} for side-by-side`}
                      >
                        ⤒
                      </button>
                    </span>
                    {i < list.length - 1 && <span style={parallelsSep}>·</span>}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </section>
      )}

      {parallels && parallels.length > 0 && !compact && (
        <section style={parallelsSection}>
          <h3 style={parallelsHeader}>Parallels</h3>
          <p style={parallelsHint}>
            Click to open · pin ⤒ to compare side-by-side
          </p>
          {Array.from(parallelsByType.entries()).map(([type, list]) => (
            <div key={type} style={parallelsTypeRow}>
              <span style={parallelsTypeLabel}>
                {type === 'parallels' ? 'direct' : type}
              </span>
              <span style={parallelsList}>
                {list.map((p, i) => (
                  <span key={p.parallel_id + i}>
                    {p.parallel_have && p.parallel_citation ? (
                      <span style={parallelsItem}>
                        <a
                          href={`#/read/${encodeURIComponent(p.parallel_id)}`}
                          onClick={(e) => {
                            if (isModifiedClick(e)) return;
                            e.preventDefault();
                            onNavigate?.(p.parallel_id);
                          }}
                          style={parallelsLinkBtn}
                          title={p.parallel_title || p.parallel_citation}
                        >
                          {p.parallel_citation}
                        </a>
                        <button
                          onClick={() => setPinnedLeafId?.(p.parallel_id)}
                          style={parallelsPinBtn}
                          title={`Pin ${p.parallel_citation} above to compare`}
                          aria-label={`Pin ${p.parallel_citation} for side-by-side`}
                        >
                          ⤒
                        </button>
                      </span>
                    ) : (
                      <span style={parallelsExternal} title={p.parallel_lang ? `external · ${p.parallel_lang}` : 'external'}>
                        {p.parallel_id}
                      </span>
                    )}
                    {i < list.length - 1 && <span style={parallelsSep}>·</span>}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </section>
      )}

      <footer style={readingFooter}>
        <span style={readingCanon}>{passage.canon}</span>
        <span style={readingHint}>Select any word for actions.</span>
      </footer>

      <SelectionActions
        containerRef={ref}
        onSearch={onSearchTerm}
        onCompare={onCompareTerm}
        onNote={({ excerpt, segmentRange, text }) => {
          // Pull the English half of the segment range out of the
          // passage's segments map so the note carries both languages
          // verbatim — useful when the user is reading with Sujato
          // (segmented) and later browses notes without the reader
          // open.
          let excerptEn = '';
          if (segmentRange && passage.segments) {
            const startN = segmentRange.startKey;
            const endN = segmentRange.endKey;
            const parts = [];
            for (const k of Object.keys(passage.segments)) {
              if (compareSegKeys(k, startN) >= 0 && compareSegKeys(k, endN) <= 0) {
                const en = passage.segments[k]?.english;
                if (en) parts.push(en);
              }
            }
            excerptEn = parts.join(' ').trim();
          }
          createNote({
            passageId: passage.id,
            citation: passage.citation,
            title: passage.title,
            title_en: passage.title_en,
            work: workLabel,
            startKey: segmentRange?.startKey || null,
            endKey: segmentRange?.endKey || null,
            excerpt,
            excerptEn,
            text,
          });
        }}
      />
    </article>
  );
}

// Numeric-aware compare on dotted segment keys, mirrors the helper in
// segments.js but inlined here so it stays close to the note-creation
// call site that uses it for English-range extraction.
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

const iconAction = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 30,
  height: 30,
  background: 'transparent',
  border: '1px solid rgba(var(--bc-border-rgb),0.08)',
  color: 'var(--bc-text-tertiary)',
  borderRadius: 6,
  cursor: 'pointer',
  transition: 'color 100ms ease, border-color 100ms ease',
};

const scLink = {
  display: 'inline-flex',
  alignItems: 'center',
  height: 30,
  padding: '0 10px',
  background: 'transparent',
  border: '1px solid rgba(var(--bc-accent-rgb), 0.25)',
  borderRadius: 6,
  color: 'var(--bc-text-tertiary)',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  textDecoration: 'none',
  fontFamily: 'Outfit, system-ui, sans-serif',
  transition: 'color 120ms ease, border-color 120ms ease',
};

// Narrow-viewport dropdown for passage actions. Positioned beneath the
// "…" trigger; outside-click handler in the component closes it.
const overflowMenu = {
  position: 'absolute',
  top: '100%',
  right: 0,
  marginTop: 6,
  // Bounded so the menu can't push past the viewport on narrow.
  // Without this, a 200px-min menu anchored too close to the right
  // edge of a 375px phone left the content visually off-screen.
  minWidth: 180,
  maxWidth: 'calc(100vw - 32px)',
  background: 'var(--bc-bg-elevated, var(--bc-bg))',
  border: '1px solid rgba(var(--bc-accent-rgb), 0.22)',
  borderRadius: 8,
  boxShadow: '0 6px 24px rgba(0,0,0,0.28)',
  zIndex: 30,
  padding: 4,
  display: 'flex',
  flexDirection: 'column',
};

const overflowItem = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  width: '100%',
  padding: '8px 10px',
  background: 'transparent',
  border: 'none',
  borderRadius: 6,
  color: 'var(--bc-text-secondary)',
  fontFamily: '"Noto Serif", Georgia, serif',
  fontSize: 13,
  textAlign: 'left',
  textDecoration: 'none',
  cursor: 'pointer',
};

const overflowItemActive = {
  color: 'var(--bc-accent)',
};

const overflowItemIcon = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 18,
  flexShrink: 0,
};

const backBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  background: 'transparent',
  border: 'none',
  color: 'var(--bc-text-tertiary)',
  fontSize: 13,
  letterSpacing: '0.02em',
  cursor: 'pointer',
  padding: '6px 0',
  marginBottom: 10,
  fontFamily: 'inherit',
};

const backBtnHint = {
  fontSize: 10,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--bc-text-tertiary)',
  border: '1px solid rgba(var(--bc-accent-rgb), 0.18)',
  borderRadius: 4,
  padding: '2px 6px',
};

const reading = { position: 'relative', padding: '32px 0 16px', maxWidth: 760 };

const cstMulaBanner = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 10,
  padding: '10px 14px',
  marginBottom: 18,
  border: '1px dashed rgba(var(--bc-accent-rgb), 0.30)',
  borderRadius: 0,
  background: 'rgba(var(--bc-accent-rgb), 0.05)',
};

const cstMulaBannerIcon = {
  color: 'var(--bc-accent)',
  fontSize: 14,
  lineHeight: 1.4,
  flexShrink: 0,
};

const cstMulaBannerText = {
  fontFamily: '"Noto Serif", Georgia, serif',
  fontStyle: 'italic',
  fontSize: 12,
  lineHeight: 1.55,
  color: 'var(--bc-text-secondary)',
};

const cstMulaBannerLink = {
  background: 'transparent',
  border: 'none',
  color: 'var(--bc-accent)',
  fontFamily: '"Noto Serif", Georgia, serif',
  fontStyle: 'italic',
  fontSize: 12,
  cursor: 'pointer',
  padding: 0,
  borderBottom: '1px solid rgba(var(--bc-accent-rgb), 0.45)',
};

// Header is now a column: row 1 holds citation + action icons, row 2
// holds the subtitle. Stacking row 2 below the flex row lets it span
// the full column width so the Pāli name + English title + collection
// can fit on a single line where they otherwise wouldn't share width
// with the action icons.
const readingHeader = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  // The header divider (the thin gold rule) now sits under the whole
  // chrome — identity row + toolbar — instead of under the old subtitle.
  paddingBottom: 12,
  marginBottom: 18,
  borderBottom: '1px solid rgba(var(--bc-accent-rgb), 0.22)',
};

// Identity row: the big citation and the full title share a baseline and
// wrap together when narrow. minWidth:0 + overflowWrap let long Pāli /
// commentary titles break instead of forcing horizontal overflow; the
// title is never clipped.
const citationTitleRow = {
  display: 'flex',
  alignItems: 'baseline',
  flexWrap: 'wrap',
  gap: '2px 12px',
  minWidth: 0,
};

const citationTitleText = {
  fontFamily: '"Noto Serif", Georgia, serif',
  fontSize: 13,
  color: 'var(--bc-text-tertiary)',
  lineHeight: 1.35,
  overflowWrap: 'anywhere',
  minWidth: 0,
};

// Toolbar row: find-in-passage (left, grows) + the action icons (right).
const readingHeaderRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'nowrap',
};

// Find-in-passage as it sits inline in the toolbar (no standalone bottom
// rule/margin; the header divider below handles separation).
const findRowInline = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  flex: '1 1 auto',
  minWidth: 0,
};

// Subtitle row sits below the citation+actions row and carries the
// gold rule + spacing that used to live on readingHeaderRow. Spans the
// full column width so the title can stretch across without competing
// with the action icons for space.
const readingSubtitleRow = {
  fontFamily: '"Noto Serif", Georgia, serif',
  fontSize: 13,
  color: 'var(--bc-text-tertiary)',
  lineHeight: 1.35,
  marginTop: 4,
  marginBottom: 24,
  paddingBottom: 14,
  borderBottom: '1px solid rgba(var(--bc-accent-rgb), 0.22)',
};

const readingCitationLine = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  minWidth: 0,
  flex: 1,
  // overflowWrap: 'anywhere' lets the long Pali compound words
  // (Brahmajālasuttaṃ, paṭiccasamuppādasutta, etc.) break mid-word
  // when the column gets narrow — without it the un-spaced word
  // is treated as one atom and forces the parent to overflow.
  overflowWrap: 'anywhere',
};

const readingCitation = {
  fontFamily: '"Noto Serif", Georgia, serif',
  fontStyle: 'italic',
  fontSize: 22,
  color: 'var(--bc-accent)',
  lineHeight: 1.2,
};

const readingWork = {
  fontFamily: '"Noto Serif", Georgia, serif',
  fontSize: 13,
  color: 'var(--bc-text-tertiary)',
  lineHeight: 1.35,
};

// Pāli sutta title: the scholarly primary name (Mahāsatipaṭṭhānasutta,
// Sukhasutta, …). Slightly emphasised but not as loud as the citation.
const readingTitlePali = {
  color: 'var(--bc-text-secondary)',
  fontStyle: 'normal',
};

const readingTitleEn = {
  fontStyle: 'italic',
};

const readingTitleSep = {
  color: 'var(--bc-text-tertiary)',
  opacity: 0.6,
};

const readingWorkContext = {
  fontStyle: 'italic',
  // Keep the work label together when the subtitle wraps on narrow
  // viewports. Without nowrap "Saṃyutta Nikāya" can break in the
  // middle, stranding "Nikāya" on its own line.
  whiteSpace: 'nowrap',
};

// "3 notes" chip next to the citation, surfaces personal annotations
// at a glance without competing with the citation typography.
const notesCountBadge = {
  display: 'inline-flex',
  alignItems: 'baseline',
  marginLeft: 12,
  padding: '2px 8px',
  borderRadius: 999,
  border: '1px solid rgba(var(--bc-accent-rgb), 0.35)',
  background: 'rgba(var(--bc-accent-rgb), 0.06)',
  fontFamily: 'Outfit, system-ui, sans-serif',
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  color: 'var(--bc-accent)',
  fontStyle: 'normal',
  verticalAlign: 'middle',
};

const readingTradition = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--bc-text-tertiary)',
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

const findRow = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 12,
  marginBottom: 18,
  paddingBottom: 10,
  borderBottom: '1px dashed rgba(var(--bc-accent-rgb), 0.18)',
};

const findInput = {
  flex: '0 1 280px',
  padding: '6px 0',
  border: 'none',
  borderBottom: '1px solid rgba(var(--bc-accent-rgb), 0.25)',
  background: 'transparent',
  color: 'var(--bc-text-primary)',
  fontFamily: '"Noto Serif", Georgia, serif',
  fontSize: 13,
  outline: 'none',
};

const findCount = {
  fontFamily: 'Outfit, system-ui, sans-serif',
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--bc-text-tertiary)',
  fontVariantNumeric: 'tabular-nums',
};

const findStemBtn = {
  padding: '4px 10px',
  fontFamily: 'Outfit, system-ui, sans-serif',
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  background: 'transparent',
  border: '1px solid',
  borderRadius: 999,
  cursor: 'pointer',
  transition: 'color 120ms ease, border-color 120ms ease',
};

const findDiacriticsRow = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 2,
  marginTop: -4,
  marginBottom: 14,
};

const findDiacriticBtn = {
  width: 26,
  height: 26,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'transparent',
  border: '1px solid transparent',
  color: 'var(--bc-text-secondary)',
  fontFamily: '"Noto Serif", Georgia, serif',
  fontSize: 13,
  cursor: 'pointer',
  borderRadius: 4,
  transition: 'border-color 100ms ease, color 100ms ease',
};

const groupNavRow = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 12,
  marginBottom: 18,
  paddingBottom: 12,
  borderBottom: '1px solid rgba(var(--bc-accent-rgb), 0.18)',
};

const groupNavSelectWrap = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
};

const groupNavLabel = {
  fontFamily: 'Outfit, system-ui, sans-serif',
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--bc-text-tertiary)',
};

const groupNavSelect = {
  maxWidth: 320,
  padding: '5px 8px',
  background: 'transparent',
  color: 'var(--bc-text-primary)',
  border: '1px solid rgba(var(--bc-accent-rgb), 0.25)',
  borderRadius: 6,
  fontFamily: '"Noto Serif", Georgia, serif',
  fontSize: 13,
  cursor: 'pointer',
};

const groupNavStatus = {
  fontFamily: 'Outfit, system-ui, sans-serif',
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--bc-text-tertiary)',
  fontVariantNumeric: 'tabular-nums',
};

const groupNavPager = {
  display: 'inline-flex',
  gap: 6,
};

const groupNavBtn = {
  padding: '4px 10px',
  fontFamily: 'Outfit, system-ui, sans-serif',
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  background: 'transparent',
  color: 'var(--bc-accent)',
  border: '1px solid rgba(var(--bc-accent-rgb), 0.25)',
  borderRadius: 999,
  cursor: 'pointer',
  transition: 'color 120ms ease, border-color 120ms ease',
};

const groupNavTextBtn = {
  marginLeft: 'auto',
  padding: '4px 2px',
  fontFamily: 'Outfit, system-ui, sans-serif',
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  background: 'transparent',
  color: 'var(--bc-text-secondary)',
  border: 'none',
  borderBottom: '1px solid rgba(var(--bc-accent-rgb), 0.3)',
  cursor: 'pointer',
};

const columnSwitchRow = {
  display: 'flex',
  gap: 4,
  marginBottom: 18,
  borderBottom: '1px solid rgba(var(--bc-accent-rgb), 0.18)',
};

const columnSwitchBtn = {
  flex: 1,
  background: 'transparent',
  border: 'none',
  borderBottom: '2px solid transparent',
  padding: '10px 12px',
  fontFamily: 'Outfit, system-ui, sans-serif',
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  transition: 'color 120ms ease, border-color 120ms ease',
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

const readingFooter = {
  marginTop: 20,
  paddingTop: 14,
  borderTop: '1px solid rgba(var(--bc-border-rgb),0.05)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  gap: 16,
};

const readingCanon = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--bc-text-tertiary)',
};

const readingHint = {
  fontFamily: '"Noto Serif", Georgia, serif',
  fontStyle: 'italic',
  fontSize: 11,
  color: 'var(--bc-text-tertiary)',
};

const translatorChipRow = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
  marginBottom: 18,
  paddingBottom: 12,
  borderBottom: '1px dashed rgba(var(--bc-accent-rgb), 0.12)',
};

const translatorChip = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 10px',
  background: 'transparent',
  border: '1px solid rgba(var(--bc-accent-rgb), 0.18)',
  borderRadius: 999,
  fontFamily: '"Noto Serif", Georgia, serif',
  fontSize: 12,
  cursor: 'pointer',
  transition: 'color 100ms ease, border-color 100ms ease',
};

const readingAtiBadge = {
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: '0.10em',
  padding: '1px 5px',
  borderRadius: 3,
  border: '1px solid rgba(var(--bc-accent-rgb), 0.40)',
  color: 'var(--bc-accent)',
  textTransform: 'uppercase',
  fontFamily: 'Outfit, system-ui, sans-serif',
};

const attribFooter = {
  marginTop: 12,
  padding: '6px 10px',
  borderLeft: '2px solid rgba(var(--bc-accent-rgb), 0.18)',
  fontSize: 11,
  fontStyle: 'italic',
  color: 'var(--bc-text-tertiary)',
  fontFamily: '"Noto Serif", Georgia, serif',
  lineHeight: 1.5,
};

const attribLink = {
  color: 'var(--bc-text-tertiary)',
  textDecoration: 'underline',
  textUnderlineOffset: 2,
};

const attribNotes = {
  color: 'var(--bc-text-tertiary)',
};

// Translator name gets a subtle emphasis inside the attribution footer
// — same line, slightly brighter, no italic since the surrounding
// footer is already italic.
const attribTranslator = {
  fontStyle: 'normal',
  color: 'var(--bc-text-secondary)',
};

const tagsSection = {
  marginTop: 24,
  paddingTop: 16,
  borderTop: '1px dashed rgba(var(--bc-accent-rgb), 0.18)',
};

const tagsHeader = {
  margin: '0 0 10px',
  fontFamily: 'Outfit, system-ui, sans-serif',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--bc-text-secondary)',
};

const tagsTypeRow = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 12,
  marginBottom: 8,
  flexWrap: 'wrap',
};

const tagsTypeLabel = {
  fontFamily: 'Outfit, system-ui, sans-serif',
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--bc-text-tertiary)',
  flexShrink: 0,
  minWidth: 56,
};

const tagsList = {
  display: 'inline',
  fontFamily: '"Noto Serif", Georgia, serif',
  fontSize: 13,
  lineHeight: 1.7,
  color: 'var(--bc-text-secondary)',
};

const tagChip = {
  fontFamily: '"Noto Serif", Georgia, serif',
  fontStyle: 'italic',
  fontSize: 13,
  color: 'var(--bc-text-secondary)',
};

const tagsSep = {
  color: 'var(--bc-text-tertiary)',
  opacity: 0.5,
  margin: '0 4px',
};

const parallelsSection = {
  marginTop: 24,
  paddingTop: 16,
  borderTop: '1px dashed rgba(var(--bc-accent-rgb), 0.18)',
};

const parallelsHeader = {
  margin: '0 0 10px',
  fontFamily: 'Outfit, system-ui, sans-serif',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--bc-text-secondary)',
};

const parallelsTypeRow = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 12,
  marginBottom: 8,
  flexWrap: 'wrap',
};

const parallelsTypeLabel = {
  fontFamily: 'Outfit, system-ui, sans-serif',
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--bc-text-tertiary)',
  flexShrink: 0,
  minWidth: 56,
};

const parallelsList = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'baseline',
  rowGap: 4,
  flex: '1 1 auto',
  minWidth: 0,
  fontFamily: '"Noto Serif", Georgia, serif',
  fontSize: 13,
  lineHeight: 1.8,
  color: 'var(--bc-text-secondary)',
};

const parallelsLinkBtn = {
  background: 'transparent',
  border: 'none',
  color: 'var(--bc-accent)',
  fontFamily: '"Noto Serif", Georgia, serif',
  fontStyle: 'italic',
  fontSize: 13,
  cursor: 'pointer',
  padding: '0 4px',
  borderBottom: '1px solid rgba(var(--bc-accent-rgb), 0.30)',
};

const parallelsExternal = {
  color: 'var(--bc-text-tertiary)',
  fontFamily: '"Noto Serif", Georgia, serif',
  fontStyle: 'italic',
  fontSize: 13,
  padding: '0 4px',
};

const parallelsSep = {
  color: 'var(--bc-text-tertiary)',
  opacity: 0.5,
  margin: '0 2px',
};

const parallelsHint = {
  margin: '0 0 14px',
  fontFamily: '"Noto Serif", Georgia, serif',
  fontStyle: 'italic',
  fontSize: 11,
  color: 'var(--bc-text-tertiary)',
};

const parallelsItem = {
  display: 'inline-flex',
  alignItems: 'baseline',
  gap: 2,
};

const parallelsPinBtn = {
  background: 'transparent',
  border: 'none',
  color: 'var(--bc-text-tertiary)',
  fontSize: 11,
  cursor: 'pointer',
  padding: '0 4px',
  transition: 'color 100ms ease',
};

const navRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 16,
  paddingBottom: 14,
  marginBottom: 18,
  borderBottom: '1px solid rgba(var(--bc-border-rgb),0.05)',
};

// prev/next nav are anchors so right-click / Cmd-click work; this
// resets the default link styling so they read like the old buttons.
const navBtnLinkReset = {
  textDecoration: 'none',
};

const navBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 10,
  padding: '4px 8px',
  background: 'transparent',
  border: 'none',
  color: 'var(--bc-text-secondary)',
  fontFamily: 'inherit',
  cursor: 'pointer',
  textAlign: 'left',
  maxWidth: '45%',
  minWidth: 0,
};

const navArrow = { color: 'var(--bc-text-tertiary)', fontSize: 11, flexShrink: 0 };
const navLabel = { display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 };

const navName = {
  fontFamily: '"Noto Serif", Georgia, serif',
  fontStyle: 'italic',
  fontSize: 13,
  color: 'var(--bc-accent)',
};

const navSubtitle = {
  fontFamily: '"Noto Serif", Georgia, serif',
  fontSize: 11,
  color: 'var(--bc-text-tertiary)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};
