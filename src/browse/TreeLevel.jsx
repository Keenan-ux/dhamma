// Recursive tree level. Renders rows at this depth; for the row whose id
// matches path[depth], renders its children indented immediately below.
// Clicking a row re-uses `onSelect(depth, node)` from the parent: open
// to drill, click-again on the open row to collapse, click a leaf to
// load the passage.
export default function TreeLevel({ items, depth, path, leafId, onSelect }) {
  if (!items?.length) return null;
  return (
    <div style={depth === 0 ? undefined : { ...levelInset, animation: 'dhammaColSlide 200ms ease-out' }}>
      {items.map((node) => {
        const isExpanded = path[depth] === node.id;
        const isSelectedLeaf = node.passageId && node.id === leafId;
        const isStub = !!node.stub;
        const isLeaf = !!node.passageId;
        const tone = isStub
          ? 'var(--bc-text-tertiary)'
          : (isExpanded || isSelectedLeaf)
            ? 'var(--bc-accent)'
            : 'var(--bc-text-primary)';
        return (
          <div key={node.id}>
            <button
              onClick={() => onSelect(depth, node)}
              disabled={isStub}
              style={{
                ...row,
                color: tone,
                opacity: isStub ? 0.5 : 1,
                background: (isExpanded || isSelectedLeaf) ? 'rgba(var(--bc-accent-rgb), 0.06)' : 'transparent',
                cursor: isStub ? 'default' : 'pointer',
              }}
            >
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
                <span style={rowName}>{node.name}</span>
                {node.subtitle && <span style={rowSubtitle}>{node.subtitle}</span>}
              </span>
              {!isStub && !isLeaf && (
                <span style={chev} aria-hidden="true">{isExpanded ? '⌃' : '⌄'}</span>
              )}
              {isLeaf && <span style={leafDot} aria-hidden="true">•</span>}
            </button>
            {isExpanded && node.children?.length > 0 && (
              <TreeLevel
                items={node.children}
                depth={depth + 1}
                path={path}
                leafId={leafId}
                onSelect={onSelect}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Each nested level indents and gets a faint vertical guide on its
// left edge — standard tree-view feel, makes the hierarchy obvious at
// a glance without bombarding the user with sibling lists at every
// depth like the old stacked-columns layout did.
const levelInset = {
  paddingLeft: 18,
  marginLeft: 16,
  borderLeft: '1px solid rgba(var(--bc-accent-rgb), 0.18)',
};

const row = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 8,
  width: '100%',
  padding: '10px 14px',
  border: 'none',
  textAlign: 'left',
  fontFamily: 'inherit',
  transition: 'background 100ms ease',
};

const rowName = {
  fontFamily: '"Noto Serif", Georgia, serif',
  fontSize: 14,
  lineHeight: 1.35,
};

const rowSubtitle = {
  fontFamily: '"Noto Serif", Georgia, serif',
  fontStyle: 'italic',
  fontSize: 11,
  color: 'var(--bc-text-tertiary)',
  lineHeight: 1.3,
};

const chev = { color: 'var(--bc-text-tertiary)', fontSize: 14, marginTop: 1, flexShrink: 0 };
const leafDot = { color: 'var(--bc-accent)', fontSize: 18, lineHeight: 1, marginTop: 4, flexShrink: 0 };
