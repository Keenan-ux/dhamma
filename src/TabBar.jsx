export default function TabBar({ active, onChange }) {
  const tabs = [
    { key: 'browse',     label: 'Browse' },
    { key: 'search',     label: 'Search' },
    { key: 'compare',    label: 'Compare' },
    { key: 'dictionary', label: 'Dictionary' },
  ];
  return (
    <nav style={wrap}>
      {tabs.map((t) => {
        const on = t.key === active;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            style={{
              ...tabBtn,
              color: on ? 'var(--bc-accent)' : 'var(--bc-text-tertiary)',
              borderBottomColor: on ? 'var(--bc-accent)' : 'transparent',
            }}
          >
            {t.label}
          </button>
        );
      })}
    </nav>
  );
}

const wrap = {
  display: 'flex',
  gap: 8,
  padding: '0 16px',
  background: 'var(--bc-bg-base)',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
  flexShrink: 0,
};

const tabBtn = {
  background: 'transparent',
  border: 'none',
  borderBottom: '2px solid transparent',
  padding: '12px 14px 10px',
  fontFamily: 'inherit',
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.02em',
  cursor: 'pointer',
  transition: 'color 120ms ease, border-color 120ms ease',
};
