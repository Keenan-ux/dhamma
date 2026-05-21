// About page. Typeset frontmatter to match the corpus pages
// (Tipiṭaka, Commentaries, Extra-canonical, Library) — same serif
// title with letter-spaced caps, thin gold rules above and below,
// and short paragraphs in the body.
//
// Reachable from the Sidebar "About" link (desktop) and the slide-in
// menu "About" item (mobile). URL is /about.

const SERIF = '"Noto Serif", Georgia, serif';

export default function AboutView() {
  return (
    <div style={scrollWrap}>
      <header style={pageHeader}>
        <div style={rule} />
        <h1 style={pageTitle}>About</h1>
        <p style={pageSubtitle}>
          a search and reading tool for Buddhist canonical texts
        </p>
        <div style={rule} />
      </header>

      <div style={bodyWrap}>
        <p style={para}>
          Dhamma data is an open-source scholarly tool for working
          with the Pali canon and its surrounding literature. You can
          browse the Tipiṭaka, the major aṭṭhakathā commentaries, the
          ṭīkā sub-commentaries, and a long tail of extra-canonical
          works in their original Pali and — where translations
          exist — in English.
        </p>

        <p style={para}>
          Searches run in three modes: exact word, stem (so
          <i> sampajāna </i>finds <i>sampajāno</i>, <i>sampajānakārī</i>,
          and so on), and meaning. The meaning mode uses a BGE-M3
          vector index, which returns passages that express an idea
          even when the literal words differ. Selecting any word in
          the reader opens a side panel with entries from six
          dictionaries: DPD, DPPN, the PTS PED, Buddhadatta&rsquo;s CPED,
          Monier-Williams, and Edgerton&rsquo;s BHS.
        </p>

        <p style={para}>
          There is no AI summary by default, no analytics, no
          telemetry, no account, no paywall. The tool finds; the
          scholar interprets.
        </p>

        <h2 style={section}>The corpus</h2>
        <ul style={list}>
          <li style={item}>
            <span style={src}>SuttaCentral</span> &nbsp;·&nbsp;
            Pali Tipiṭaka and Bhante Sujato&rsquo;s English
            translations (CC0).
          </li>
          <li style={item}>
            <span style={src}>VRI / CST</span> &nbsp;·&nbsp;
            Aṭṭhakathā, ṭīkā, and extra-canonical works from the
            Chaṭṭha Saṅgāyana edition.
          </li>
          <li style={item}>
            <span style={src}>Access to Insight</span> &nbsp;·&nbsp;
            multi-translator English coverage (Ṭhānissaro, Walshe,
            Bhikkhu Bodhi extracts, Ireland, Nyanaponika, Olendzki,
            Piyadassi, Ñāṇamoli, Soma, Buddharakkhita, and others)
            plus 386 secondary articles. Honoured under CC BY-NC 4.0.
          </li>
          <li style={item}>
            <span style={src}>SuttaCentral parallels.json</span> &nbsp;·&nbsp;
            cross-references between Pali suttas and their Sanskrit,
            Chinese, and Gāndhārī counterparts.
          </li>
        </ul>

        <h2 style={section}>Dictionaries</h2>
        <ul style={list}>
          <li style={item}>
            <span style={src}>DPD</span> &nbsp;·&nbsp; Digital Pāḷi
            Dictionary (Bodhirasa), CC BY-NC-SA 4.0.
          </li>
          <li style={item}>
            <span style={src}>DPPN</span> &nbsp;·&nbsp; Dictionary of
            Pali Proper Names (Malalasekera 1937, rev. Ānandajoti
            2025).
          </li>
          <li style={item}>
            <span style={src}>PED</span> &nbsp;·&nbsp; Pali Text
            Society Pali-English Dictionary (Rhys Davids &amp; Stede,
            1921&ndash;25), CC BY-NC 3.0.
          </li>
          <li style={item}>
            <span style={src}>CPED</span> &nbsp;·&nbsp; Concise
            Pali-English Dictionary (Buddhadatta 1949, ed.
            Ānandajoti) via Ancient Buddhist Texts.
          </li>
          <li style={item}>
            <span style={src}>MW</span> &nbsp;·&nbsp; Monier-Williams
            Sanskrit-English Dictionary, Cologne digitisation.
          </li>
          <li style={item}>
            <span style={src}>BHS</span> &nbsp;·&nbsp; Edgerton&rsquo;s
            Buddhist Hybrid Sanskrit, Cologne digitisation.
          </li>
        </ul>

        <h2 style={section}>Why this exists</h2>
        <p style={para}>
          The idea came up on a Satipaṭṭhāna retreat. The Pali canon
          is already free and online &mdash; at SuttaCentral, at
          Access to Insight, in the VRI&rsquo;s CST &mdash; but
          moving across those sources, looking up a word, checking a
          parallel, and reading a commentary on the same passage
          takes more clicking than it should. A scholar who has
          internalised the canon doesn&rsquo;t need that friction. A
          new student certainly doesn&rsquo;t.
        </p>

        <p style={para}>
          The tool is built for people who treat the texts as primary
          sources, not as something to be summarised on their behalf.
          Corrections and contributions are welcome: see the GitHub
          repository for issue tracking and pull requests.
        </p>

        <h2 style={section}>Source &amp; licence</h2>
        <p style={para}>
          Code is MIT-licensed. Corpus data carries the licences
          listed above, which the tool honours in display and
          attribution. The non-commercial constraint of CC BY-NC 4.0
          is the binding limit — Dhamma data will not carry
          advertising, paywalls, or commercial features.
        </p>
        <p style={para}>
          <a
            href="https://github.com/Keenan-ux/dhamma"
            target="_blank"
            rel="noopener noreferrer"
            style={link}
          >
            github.com/Keenan-ux/dhamma →
          </a>
        </p>
      </div>

      <footer style={footerWrap}>
        <div style={rule} />
      </footer>
    </div>
  );
}

const scrollWrap = { position: 'absolute', inset: 0, overflow: 'auto' };

const pageHeader = {
  maxWidth: 760,
  margin: '0 auto',
  padding: '40px 28px 24px',
  textAlign: 'center',
};

const pageTitle = {
  margin: '24px 0 6px',
  fontFamily: SERIF,
  fontSize: 38,
  fontWeight: 500,
  letterSpacing: '0.30em',
  textTransform: 'uppercase',
  color: 'var(--bc-text-primary)',
  paddingLeft: '0.30em',
};

const pageSubtitle = {
  margin: '6px 0 24px',
  fontFamily: SERIF,
  fontStyle: 'italic',
  fontSize: 14,
  color: 'var(--bc-text-tertiary)',
};

const rule = {
  height: 1,
  background: 'rgba(var(--bc-accent-rgb), 0.30)',
  margin: '0 auto',
  maxWidth: 280,
};

const bodyWrap = {
  maxWidth: 720,
  margin: '32px auto 0',
  padding: '0 28px',
};

const para = {
  margin: '0 0 18px',
  fontFamily: SERIF,
  fontSize: 15,
  lineHeight: 1.7,
  color: 'var(--bc-text-secondary)',
};

const section = {
  margin: '36px 0 14px',
  fontFamily: SERIF,
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--bc-accent)',
};

const list = {
  margin: '0 0 18px',
  padding: 0,
  listStyle: 'none',
};

const item = {
  margin: '0 0 10px',
  fontFamily: SERIF,
  fontSize: 14,
  lineHeight: 1.65,
  color: 'var(--bc-text-secondary)',
};

const src = {
  display: 'inline-block',
  minWidth: 92,
  fontWeight: 600,
  color: 'var(--bc-text-primary)',
};

const link = {
  fontFamily: 'Outfit, system-ui, sans-serif',
  fontSize: 12,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--bc-accent)',
  textDecoration: 'none',
  borderBottom: '1px solid rgba(var(--bc-accent-rgb), 0.35)',
  paddingBottom: 2,
};

const footerWrap = {
  maxWidth: 280,
  margin: '64px auto 56px',
  padding: '0 28px',
};
