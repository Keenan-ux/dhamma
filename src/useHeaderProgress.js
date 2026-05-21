// Scroll-driven gradual-collapse progress for sticky headers.
//
// Adapted from the report-page header pattern in boothcheck. Same
// shape as that hook — progress tracks scrollTop 1:1 from 0 to a
// configurable collapse height, then ratchets locked at 1 so that
// mid-page upward scrolling doesn't surprise-re-expand the header.
// Only when scrollTop falls below a small re-expand zone (default
// 80 px) does the ratchet unlock and progress can shrink back to 0.
//
// The consuming component uses `progress` (0 = fully visible,
// 1 = fully collapsed) to drive maxHeight / opacity / borderBottom
// of its sticky header — no CSS transitions needed because the
// hook itself updates state on every scroll frame.

import { useEffect, useRef, useState } from 'react';

export default function useHeaderProgress({
  selector = '[data-scroll-root]',
  collapseHeight = 200,
  reExpandZone = 80,
} = {}) {
  const [progress, setProgress] = useState(0);
  const collapsedRef = useRef(false);

  useEffect(() => {
    let currentEl = null;

    function onScroll() {
      if (!currentEl) return;
      const y = currentEl.scrollTop;
      if (!collapsedRef.current) {
        // Phase 1: gradual collapse as the user scrolls down. The
        // progress value tracks scrollTop 1:1 — no threshold, no
        // snap. Once it crosses 1 the ratchet locks.
        const p = Math.min(1, y / collapseHeight);
        setProgress(p);
        if (p >= 1) collapsedRef.current = true;
      } else {
        // Phase 2: collapsed lock. Stay at 1 until scrollTop drops
        // back inside the re-expand zone near the top, then resume
        // tracking 1:1 as the header reappears.
        if (y < reExpandZone) {
          collapsedRef.current = false;
          setProgress(Math.min(1, y / collapseHeight));
        } else {
          setProgress(1);
        }
      }
    }

    function attach() {
      const el = document.querySelector(selector);
      if (el === currentEl) return;
      if (currentEl) currentEl.removeEventListener('scroll', onScroll);
      currentEl = el;
      if (currentEl) {
        currentEl.addEventListener('scroll', onScroll, { passive: true });
        // Reset state for a new scroll container (route change).
        setProgress(0);
        collapsedRef.current = false;
      }
    }

    attach();
    // Re-attach when the scroll-root element changes (route nav).
    const observer = new MutationObserver(() => attach());
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      if (currentEl) currentEl.removeEventListener('scroll', onScroll);
      observer.disconnect();
    };
  }, [selector, collapseHeight, reExpandZone]);

  return progress;
}
