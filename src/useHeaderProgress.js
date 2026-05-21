// Scroll-driven gradual-collapse progress for sticky headers.
//
// Returns `progress` (0 = fully visible, 1 = fully collapsed). The
// caller drives maxHeight / opacity / etc. of its sticky chrome
// from that value. Progress tracks scrollTop 1:1 from 0 up to
// `collapseHeight`, ratchet-locks at 1 once it crosses, and only
// unlocks when scrollTop drops back below `reExpandZone` near the
// top — so mid-page upward scrolling doesn't surprise-re-expand.
//
// Two anti-stutter measures matter when the consumer drives
// layout-affecting properties (maxHeight, height, padding) from
// progress:
//
//   1. requestAnimationFrame throttle. The scroll handler may fire
//      faster than the browser can settle layout, and changing
//      maxHeight changes the document scrollHeight, which can
//      adjust scrollTop, which fires another scroll event — a
//      feedback loop that reads as visual stutter. Coalescing
//      reads to one per animation frame breaks the loop.
//   2. Small dead zones at 0 and 1. Without them, rapid
//      oscillation around the endpoints (caused by layout-induced
//      scrollTop adjustments of a pixel or two) flickers the
//      header between fully-collapsed and almost-collapsed.

import { useEffect, useRef, useState } from 'react';

export default function useHeaderProgress({
  selector = '[data-scroll-root]',
  collapseHeight = 200,
  reExpandZone = 80,
} = {}) {
  const [progress, setProgress] = useState(0);
  const collapsedRef = useRef(false);
  const rafRef = useRef(0);
  const progressRef = useRef(0);

  useEffect(() => {
    let currentEl = null;

    function compute() {
      rafRef.current = 0;
      if (!currentEl) return;
      const y = currentEl.scrollTop;
      let p;
      if (!collapsedRef.current) {
        p = Math.min(1, y / collapseHeight);
        if (p >= 0.98) {
          p = 1;
          collapsedRef.current = true;
        }
      } else {
        if (y < reExpandZone) {
          collapsedRef.current = false;
          p = Math.min(1, y / collapseHeight);
        } else {
          p = 1;
        }
      }
      // Snap near-zero to zero. Tiny scroll bounces shouldn't
      // produce flickery sub-pixel progress values.
      if (p < 0.02) p = 0;
      // Only commit if it actually changed enough to be perceptible.
      // This keeps React from re-rendering on every sub-pixel scroll
      // tick, which is what was making maxHeight stutter.
      if (Math.abs(p - progressRef.current) < 0.005 && p !== 0 && p !== 1) return;
      progressRef.current = p;
      setProgress(p);
    }

    function onScroll() {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(compute);
    }

    function attach() {
      const el = document.querySelector(selector);
      if (el === currentEl) return;
      if (currentEl) currentEl.removeEventListener('scroll', onScroll);
      currentEl = el;
      if (currentEl) {
        currentEl.addEventListener('scroll', onScroll, { passive: true });
        progressRef.current = 0;
        collapsedRef.current = false;
        setProgress(0);
      }
    }

    attach();
    const observer = new MutationObserver(() => attach());
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (currentEl) currentEl.removeEventListener('scroll', onScroll);
      observer.disconnect();
    };
  }, [selector, collapseHeight, reExpandZone]);

  return progress;
}
