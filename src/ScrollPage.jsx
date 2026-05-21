// Common wrapper for top-level page views. Every browseable view
// (Tipiṭaka, Commentaries, Reader, Search, Library, About, etc.)
// uses this as its outer scroll container so:
//   1. The fixed TopNav (56 px) has padding clearance — view content
//      starts below the bar at rest, scrolls under it as the user
//      scrolls down.
//   2. The useScrollHide hook can find the active scroll element via
//      the [data-scroll-root] selector — one place to look,
//      regardless of which view is mounted.
//
// Views opt in by replacing their `<div style={{position:'absolute',
// inset:0, overflow:'auto', ...}}>` outermost with <ScrollPage>.

export default function ScrollPage({ children, style }) {
  return (
    <div data-scroll-root="" style={{ ...scrollPageStyle, ...style }}>
      {children}
    </div>
  );
}

const scrollPageStyle = {
  position: 'absolute',
  inset: 0,
  overflow: 'auto',
  // Padding for the fixed TopNav. Content sits below the bar at
  // rest, scrolls under it as the user scrolls down. When the bar
  // fades on scroll, this padding has already scrolled off-screen,
  // so the body content fills the full viewport.
  paddingTop: 56,
};
