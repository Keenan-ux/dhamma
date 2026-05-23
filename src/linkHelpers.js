// Shared helpers for converting clickable rows into real-anchor links
// so the browser's native "Open in New Tab" / Cmd-click / middle-click
// behaviours work — without losing the SPA routing on plain clicks.
//
// Usage pattern:
//
//   <a
//     href={routeHref(...)}
//     onClick={(e) => {
//       if (isModifiedClick(e)) return;   // let the browser handle it
//       e.preventDefault();
//       doSpaRouting(...);
//     }}
//   >…</a>
//
// The href carries the destination so right-click context menus,
// Cmd/Ctrl/Shift/middle-click, and "Copy link" all do the right thing.
// Plain clicks fall through to the existing SPA handler.

// A click should be treated as a "let the browser handle this" if any
// of the modifier keys are held OR if it's the middle mouse button.
// Cmd/Ctrl/Shift = open in new tab/window; middle = same. Alt is
// included for consistency though it usually means "save link as".
export function isModifiedClick(e) {
  return e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1;
}

// Build the hash href for a passage. Library hits use the article
// reader URL; everything else uses /read/<id>. Mirrors Dhamma.jsx's
// onOpenPassage routing.
export function passageHref(passage) {
  if (!passage || !passage.id) return '#/';
  if (passage.library) return `#/library/${encodeURIComponent(passage.id)}`;
  return `#/read/${encodeURIComponent(passage.id)}`;
}

// Build the hash href for a work-drill destination (clicking a work
// name on Tipiṭaka / Commentaries / Extra-canonical). Path is an
// array of slugs, same shape as Dhamma.jsx's browsePath.
export function browseHref(path) {
  const segs = (path || []).map((s) => encodeURIComponent(s)).join('/');
  return segs ? `#/browse/${segs}` : '#/';
}

// Build the hash href for a Library article.
export function libraryHref(slug) {
  return slug ? `#/library/${encodeURIComponent(slug)}` : '#/library';
}
