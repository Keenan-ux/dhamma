import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Leaf from './Leaf.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import useScrollHide from './useScrollHide.js';

const MOBILE_BREAKPOINT = 1024;

// Mirror of Sidebar.NAV_ITEMS — renders inside the slide-in panel on
// mobile so the sidebar nav doesn't have to occupy real estate full-time.
const NAV_ITEMS = [
  { key: 'tipitaka',    label: 'Tipiṭaka',        group: 'corpus' },
  { key: 'commentary',  label: 'Commentaries',    group: 'corpus' },
  { key: 'anya',        label: 'Extra-canonical', group: 'corpus' },
  { key: 'library',     label: 'Library',         group: 'corpus' },
  { key: 'search',      label: 'Search',          group: 'tools' },
  { key: 'concordance', label: 'Concordance',     group: 'tools' },
  { key: 'dictionary',  label: 'Dictionary',      group: 'tools' },
  { key: 'tags',        label: 'Tags',            group: 'tools' },
  { key: 'bookmarks',   label: 'Bookmarks',       group: 'tools' },
  { key: 'notes',       label: 'Notes',           group: 'tools' },
];

export default function TopNav({ tab, setTab, onRandomSutta, onHome }) {
  const [open, setOpen] = useState(false);
  // Hide-on-scroll. Pauses while the dropdown/slide-in is open so
  // the chrome can't disappear mid-interaction.
  const hidden = useScrollHide({ paused: open });
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT);
  const [panelVisible, setPanelVisible] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const panelRef = useRef(null);
  const dropdownRef = useRef(null);
  const btnRef = useRef(null);

  // Track viewport so we can swap dropdown ↔ slide-in panel.
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Slide-in animation kick on next frame so the transition runs.
  useEffect(() => {
    if (open && isMobile) {
      const id = requestAnimationFrame(() => setPanelVisible(true));
      return () => cancelAnimationFrame(id);
    }
    setPanelVisible(false);
  }, [open, isMobile]);

  // Desktop click-outside-to-close (mobile uses backdrop).
  useEffect(() => {
    if (!open || isMobile) return;
    function onDocClick(e) {
      if (dropdownRef.current?.contains(e.target)) return;
      if (btnRef.current?.contains(e.target)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('touchstart', onDocClick);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('touchstart', onDocClick);
    };
  }, [open, isMobile]);

  // Touch swipe-right-to-dismiss on the mobile panel.
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const swipeLocked = useRef(null);
  const onTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    swipeLocked.current = null;
  }, []);
  const onTouchMove = useCallback((e) => {
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (!swipeLocked.current && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
      swipeLocked.current = Math.abs(dy) > Math.abs(dx) ? 'vertical' : 'horizontal';
    }
    if (swipeLocked.current === 'horizontal' && dx > 0) setSwipeOffset(dx);
  }, []);
  const onTouchEnd = useCallback(() => {
    if (swipeOffset > 80) setOpen(false);
    setSwipeOffset(0);
  }, [swipeOffset]);

  // PWA install prompt — captured for the "Install as app" CTA inside the panel.
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    if (standalone) { setInstalled(true); return; }
    const onPrompt = (e) => { e.preventDefault(); setInstallPrompt(e); };
    const onInstalled = () => { setInstalled(true); setInstallPrompt(null); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);
  async function handleInstall() {
    if (!installPrompt) return;
    const e = installPrompt;
    setInstallPrompt(null);
    setOpen(false);
    e.prompt();
    const { outcome } = await e.userChoice;
    if (outcome === 'accepted') setInstalled(true);
  }

  const panelContent = (
    <div
      ref={panelRef}
      style={isMobile ? {
        ...mobilePanel,
        transform: `translateX(${swipeOffset > 0 ? swipeOffset + 'px' : (panelVisible ? '0' : '100%')})`,
        transition: swipeOffset > 0 ? 'none' : 'transform 0.3s ease-out',
      } : desktopDropdown}
      onTouchStart={isMobile ? onTouchStart : undefined}
      onTouchMove={isMobile ? onTouchMove : undefined}
      onTouchEnd={isMobile ? onTouchEnd : undefined}
    >
      {/* Mobile header with close */}
      {isMobile && (
        <div style={panelHeader}>
          <span style={panelHeaderLabel}>Menu</span>
          <button onClick={() => setOpen(false)} aria-label="Close" style={closeBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      <div style={isMobile ? panelBodyMobile : panelBodyDesktop}>
        {/* Navigation lives inside the mobile panel so the sidebar
            doesn't have to be visible on narrow screens. On desktop the
            sidebar carries this so the panel keeps its lighter
            (Install / About / etc.) role. */}
        {isMobile && setTab && (
          <>
            <div style={navSectionLabel}>Corpus</div>
            <div style={navList}>
              {NAV_ITEMS.filter((i) => i.group === 'corpus').map((item) => (
                <NavItem key={item.key} item={item} active={tab === item.key} onClick={() => { setTab(item.key); setOpen(false); }} />
              ))}
            </div>
            <div style={navList}>
              {NAV_ITEMS.filter((i) => i.group === 'tools').map((item) => (
                <NavItem key={item.key} item={item} active={tab === item.key} onClick={() => { setTab(item.key); setOpen(false); }} />
              ))}
              {onRandomSutta && (
                <NavItem
                  item={{ key: '__random', label: 'Random sutta' }}
                  active={false}
                  onClick={() => { onRandomSutta(); setOpen(false); }}
                />
              )}
            </div>
            <div style={divider} />
          </>
        )}

        {/* Install as App */}
        {!installed && installPrompt && (
          <button onClick={handleInstall} style={installCta}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
              <path d="M12 5v14M5 12l7 7 7-7" />
              <path d="M4 19h16" />
            </svg>
            INSTALL AS APP
          </button>
        )}

        {/* About — only on mobile. On desktop the Sidebar carries
            its own compact "About" link, so showing it in the
            Settings dropdown too would just duplicate the affordance.
            Mobile keeps it because there is no sidebar to host it. */}
        {isMobile && setTab && (
          <button
            onClick={() => { setTab('about'); setOpen(false); }}
            style={menuItem}
          >
            <span style={menuItemLabel}>About</span>
            <span style={menuItemSub}>What Dhamma data is and how it works</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <header
      style={{
        ...header,
        transform: hidden ? 'translateY(-100%)' : 'translateY(0)',
      }}
    >
      {/* Logo + title → home (Tipiṭaka frontmatter). Rendered as a
          button for keyboard accessibility but kept visually identical
          to the original static branding. */}
      <button
        onClick={onHome}
        style={brandBtn}
        aria-label="Dhamma data — home"
        type="button"
      >
        <Leaf size={26} />
        {/* Wordmark deliberately mixes typefaces:
            - "Dhamma" in Noto Serif to echo the page titles (TIPIṬAKA,
              SUTTA PIṬAKA, etc.) — anchors the brand in the scholarly
              voice of the body content.
            - "data" in Montserrat to keep the modern-toolish tone the
              chrome reads in everywhere else. */}
        <span style={titleStyle}>
          <span style={dhammaWord}>Dhamma</span>{' '}
          <span style={dataWord}>data</span>
        </span>
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <ThemeToggle />
        <button
          ref={btnRef}
          onClick={() => setOpen((v) => !v)}
          style={settingsBtn}
          aria-label="Settings"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ marginRight: 6 }}>
            <line x1="4" y1="7" x2="20" y2="7" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="17" x2="20" y2="17" />
          </svg>
          <span style={settingsBtnLabel}>{isMobile ? 'MENU' : 'SETTINGS'}</span>
        </button>

        {open && !isMobile && (
          <div ref={dropdownRef}>{panelContent}</div>
        )}

        {open && isMobile && createPortal(
          <>
            <div
              style={{
                ...backdrop,
                opacity: Math.max(0, 1 - swipeOffset / 200),
              }}
              onClick={() => setOpen(false)}
              onTouchEnd={(e) => { e.preventDefault(); setOpen(false); }}
            />
            {panelContent}
          </>,
          document.body
        )}
      </div>
    </header>
  );
}

// Fixed-positioned chrome so the hide-on-scroll transform reclaims
// the space at the top of the viewport when the user scrolls down.
// Backdrop blur lets content from the scroll container below show
// softly through — same effect as boothcheck's top nav.
const header = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  height: 56,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 16px',
  background: 'rgba(var(--bc-bg-base-rgb, 26, 26, 27), 0.72)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  borderBottom: '1px solid rgba(var(--bc-accent-rgb), 0.14)',
  flexShrink: 0,
  zIndex: 1000,
  transition: 'transform 0.3s ease',
};

// Reset button defaults so the brand reads as branding, not a control.
const brandBtn = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  background: 'transparent',
  border: 'none',
  padding: 0,
  margin: 0,
  cursor: 'pointer',
  color: 'inherit',
  fontFamily: 'inherit',
};

// Wrapper holds the baseline; the two words inside override fontFamily
// and weight to mix Noto Serif ("Dhamma") with Montserrat ("data").
// Flex collapses the literal " " between the spans, so the half-space
// gap is set explicitly here.
const titleStyle = {
  fontSize: 17,
  display: 'inline-flex',
  alignItems: 'baseline',
  gap: '0.25em',
};

const dhammaWord = {
  fontFamily: '"Noto Serif", Georgia, serif',
  fontWeight: 500,
  color: 'var(--bc-text-primary)',
  letterSpacing: '0.01em',
};

const dataWord = {
  fontFamily: 'Montserrat, system-ui, sans-serif',
  fontWeight: 400,
  color: 'var(--bc-text-tertiary)',
  letterSpacing: '0.02em',
};

const settingsBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  height: 36,
  padding: '0 12px',
  background: 'var(--bc-bg-surface)',
  border: '1px solid rgba(var(--bc-border-rgb),0.08)',
  color: 'var(--bc-text-primary)',
  borderRadius: 6,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const settingsBtnLabel = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.14em',
};

const desktopDropdown = {
  position: 'absolute',
  top: 'calc(100% + 8px)',
  right: 16,
  width: 320,
  maxHeight: 'calc(100dvh - 120px)',
  overflowY: 'auto',
  background: 'var(--bc-bg-elevated)',
  border: '1px solid rgba(var(--bc-border-rgb),0.08)',
  borderRadius: 12,
  boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
  zIndex: 1010,
};

const backdrop = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.45)',
  zIndex: 1005,
  transition: 'opacity 0.3s ease',
};

const mobilePanel = {
  position: 'fixed',
  top: 0,
  right: 0,
  height: '100dvh',
  width: '85vw',
  maxWidth: 360,
  background: 'var(--bc-bg-base)',
  borderLeft: '1px solid rgba(var(--bc-border-rgb),0.08)',
  boxShadow: '-8px 0 32px rgba(0,0,0,0.5)',
  zIndex: 1010,
  overflowY: 'auto',
  WebkitOverflowScrolling: 'touch',
  paddingTop: 'env(safe-area-inset-top, 0px)',
};

const panelHeader = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '20px 24px 12px',
};

const panelHeaderLabel = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--bc-text-tertiary)',
};

const closeBtn = {
  background: 'transparent',
  border: 'none',
  color: 'var(--bc-text-tertiary)',
  cursor: 'pointer',
  padding: 4,
  display: 'inline-flex',
};

const panelBodyMobile = { padding: '12px 20px 40px' };
const panelBodyDesktop = { padding: 16 };

const divider = {
  height: 1,
  background: 'rgba(var(--bc-accent-rgb), 0.14)',
  margin: '14px 0',
};

const installCta = {
  width: '100%',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '12px 14px',
  background: 'var(--bc-bg-surface)',
  border: '1px solid rgba(var(--bc-border-rgb),0.10)',
  borderRadius: 8,
  color: 'var(--bc-text-primary)',
  fontFamily: 'inherit',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.14em',
  cursor: 'pointer',
};

function NavItem({ item, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...navItemBase,
        color: active ? 'var(--bc-accent)' : 'var(--bc-text-primary)',
        background: active ? 'rgba(var(--bc-accent-rgb), 0.08)' : 'transparent',
        borderLeftColor: active ? 'var(--bc-accent)' : 'transparent',
        fontWeight: active ? 600 : 500,
      }}
    >
      {item.label}
    </button>
  );
}

const menuItem = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  width: '100%',
  textAlign: 'left',
  padding: '10px 12px',
  background: 'transparent',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const menuItemLabel = {
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--bc-text-primary)',
};

const menuItemSub = {
  fontSize: 11,
  color: 'var(--bc-text-tertiary)',
};

const navSectionLabel = {
  padding: '8px 12px 6px',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--bc-text-tertiary)',
};

const navList = {
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
  marginBottom: 10,
};

const navItemBase = {
  display: 'block',
  width: '100%',
  textAlign: 'left',
  padding: '11px 14px',
  background: 'transparent',
  border: 'none',
  borderLeft: '3px solid transparent',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 15,
  letterSpacing: '0.01em',
  transition: 'color 120ms ease, background 120ms ease, border-color 120ms ease',
};
