// About page. Typeset frontmatter to match the corpus pages
// (Tipiṭaka, Commentaries, Extra-canonical, Library) — same serif
// title with letter-spaced caps, thin gold rules above and below,
// and short paragraphs in the body.
//
// Reachable from the Sidebar "About" link (desktop) and the slide-in
// menu "About" item (mobile). URL is /about.

import { useState } from 'react';
import { contactApi } from './api.js';

const SERIF = '"Noto Serif", Georgia, serif';
const SANS  = 'Outfit, system-ui, sans-serif';
const CONTACT_EMAIL = 'Keenan@boothcheck.com';

export default function AboutView() {
  // Inline contact form state. The form is the primary contact path;
  // the email address is revealed on demand below it as a secondary
  // option for users who prefer their own mail client.
  const [fromEmail, setFromEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [status, setStatus] = useState('idle'); // 'idle' | 'sending' | 'sent' | 'error'
  const [errorText, setErrorText] = useState('');
  const [emailRevealed, setEmailRevealed] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setStatus('sending');
    setErrorText('');
    try {
      await contactApi({
        from_email: fromEmail.trim() || null,
        subject: subject.trim(),
        body: message.trim(),
        website, // honeypot — empty for real users
      });
      setStatus('sent');
      // Don't clear the fields on success — the user might want to see
      // what they just sent. They can manually clear and write again.
    } catch (err) {
      setStatus('error');
      setErrorText(
        err.status === 429
          ? "Too many messages in a short window — please wait a minute and try again."
          : "Couldn't send right now. You can email me directly instead (link below)."
      );
    }
  }

  return (
    <div data-scroll-root="" style={scrollWrap}>
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
          Dhamma data is a scholarly tool for working with the Pali
          canon and its surrounding literature. You can browse the
          Tipiṭaka, the major aṭṭhakathā commentaries, the ṭīkā
          sub-commentaries, and a long tail of extra-canonical works
          in their original Pali and — where translations exist —
          in English.
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

        <h2 style={section}>Licence</h2>
        <p style={para}>
          Corpus data carries the licences shown above and is
          displayed with the original attribution preserved. The
          non-commercial constraint of CC BY-NC 4.0 is the binding
          limit &mdash; Dhamma data will not carry advertising,
          paywalls, or commercial features.
        </p>

        <h2 style={section}>Contact</h2>
        <p style={para}>
          Dhamma data is built and maintained by one person, not an
          organisation. Replies come from me directly. Corrections,
          questions, attribution concerns, or anything else &mdash;
          please write.
        </p>

        {status === 'sent' ? (
          <div style={sentNote}>
            <p style={{ ...para, margin: 0 }}>
              Thanks &mdash; your message landed in my inbox. I read
              everything; I&rsquo;ll write back if you included an email
              address.
            </p>
            <button
              type="button"
              onClick={() => {
                setStatus('idle');
                setSubject('');
                setMessage('');
                setFromEmail('');
              }}
              style={resetBtn}
            >
              Send another
            </button>
          </div>
        ) : (
          <form onSubmit={submit} style={form} noValidate>
            <label style={fieldLabel}>
              <span style={labelText}>
                Your email <span style={labelOptional}>(optional)</span>
              </span>
              <input
                type="email"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                placeholder="you@example.com"
                style={input}
                autoComplete="email"
                maxLength={200}
              />
            </label>
            <label style={fieldLabel}>
              <span style={labelText}>Subject</span>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="What is this about?"
                style={input}
                required
                maxLength={200}
              />
            </label>
            <label style={fieldLabel}>
              <span style={labelText}>Message</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="…"
                style={textarea}
                rows={6}
                required
                maxLength={10000}
              />
            </label>
            {/* Honeypot — hidden visually + from assistive tech. Real
                users never fill it; spambots that auto-fill every input
                do, and the server silently drops those submissions. */}
            <label
              aria-hidden="true"
              tabIndex={-1}
              style={{ position: 'absolute', left: '-10000px', height: 0, width: 0, overflow: 'hidden' }}
            >
              Website (leave empty)
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </label>
            <div style={formActions}>
              <button
                type="submit"
                disabled={status === 'sending' || !subject.trim() || !message.trim()}
                style={{
                  ...sendBtn,
                  opacity: (status === 'sending' || !subject.trim() || !message.trim()) ? 0.5 : 1,
                  cursor: (status === 'sending' || !subject.trim() || !message.trim()) ? 'default' : 'pointer',
                }}
              >
                {status === 'sending' ? 'Sending…' : 'Send'}
              </button>
              {errorText && <span style={errorTextStyle}>{errorText}</span>}
            </div>
          </form>
        )}

        <p style={{ ...para, marginTop: 24, fontSize: 13 }}>
          Prefer your own mail client? {emailRevealed ? (
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=Dhamma%20data`}
              style={contactLink}
            >
              {CONTACT_EMAIL}
            </a>
          ) : (
            <button
              type="button"
              onClick={() => setEmailRevealed(true)}
              style={revealBtn}
            >
              Reveal email
            </button>
          )}
        </p>
      </div>

      <footer style={footerWrap}>
        <div style={rule} />
      </footer>
    </div>
  );
}

const scrollWrap = { position: 'absolute', inset: 0, overflow: 'auto', paddingTop: 56 };

const pageHeader = {
  maxWidth: 760,
  margin: '0 0',
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
  margin: '32px 0 0',
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

// Contact email — rendered in the body serif so it doesn't read
// like a CTA button, just a quietly emphasised line. Underline stays
// on a subtle gold; hover state inherits the accent through the link
// element's own color, so no JS needed for hover styling.
const contactLink = {
  fontFamily: SERIF,
  fontSize: 15,
  color: 'var(--bc-accent)',
  textDecoration: 'underline',
  textDecorationColor: 'rgba(var(--bc-accent-rgb), 0.40)',
  textUnderlineOffset: 4,
};

// Inline contact-form styles. Form sits in a thin gold-rule frame so
// it reads as a self-contained block within the About flow. Fields
// are full-width on every viewport; the page itself already maxes at
// 720px so this stays comfortable.
const form = {
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  padding: '20px 22px 18px',
  border: '1px solid rgba(var(--bc-accent-rgb), 0.22)',
  borderRadius: 8,
  background: 'rgba(var(--bc-accent-rgb), 0.03)',
  marginTop: 8,
};

const fieldLabel = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const labelText = {
  fontFamily: SANS,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--bc-text-secondary)',
};

const labelOptional = {
  fontWeight: 400,
  textTransform: 'none',
  letterSpacing: 'normal',
  color: 'var(--bc-text-tertiary)',
  fontStyle: 'italic',
};

const inputBase = {
  fontFamily: SERIF,
  fontSize: 14,
  lineHeight: 1.5,
  padding: '8px 10px',
  background: 'var(--bc-bg-base, transparent)',
  color: 'var(--bc-text-primary)',
  border: '1px solid rgba(var(--bc-accent-rgb), 0.20)',
  borderRadius: 4,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

const input = inputBase;
const textarea = { ...inputBase, resize: 'vertical', minHeight: 120 };

const formActions = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  flexWrap: 'wrap',
  marginTop: 4,
};

const sendBtn = {
  fontFamily: SANS,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  padding: '8px 18px',
  background: 'var(--bc-accent)',
  color: 'var(--bc-accent-text)',
  border: 'none',
  borderRadius: 999,
};

const errorTextStyle = {
  fontFamily: SERIF,
  fontSize: 12,
  fontStyle: 'italic',
  color: 'var(--bc-text-tertiary)',
};

const sentNote = {
  padding: '16px 22px',
  border: '1px solid rgba(var(--bc-accent-rgb), 0.30)',
  borderRadius: 8,
  background: 'rgba(var(--bc-accent-rgb), 0.06)',
  marginTop: 8,
};

const resetBtn = {
  marginTop: 10,
  background: 'transparent',
  border: 'none',
  padding: 0,
  fontFamily: SANS,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--bc-accent)',
  cursor: 'pointer',
};

// Reveal-email button. Quiet, same uppercase chrome family the rest
// of the page uses for small actions. Once clicked, it's replaced
// inline by the mailto link itself.
const revealBtn = {
  background: 'transparent',
  border: '1px solid rgba(var(--bc-accent-rgb), 0.30)',
  padding: '3px 10px',
  borderRadius: 999,
  fontFamily: SANS,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--bc-text-tertiary)',
  cursor: 'pointer',
};

const footerWrap = {
  maxWidth: 280,
  margin: '64px 0 56px',
  padding: '0 28px',
};
