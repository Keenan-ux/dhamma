// Auto-hide-on-scroll behaviour for sticky chrome (top nav, reader
// header). Patterned after the same hook used in boothcheck's
// TopNav — same threshold and direction logic, adapted to Dhamma's
// architecture where each view component owns its own
// position: absolute / overflow: auto scroll container rather than
// the window being the scroll root.
//
// Usage:
//   const hidden = useScrollHide({ paused: menuOpen });
//   <header style={{ transform: hidden ? 'translateY(-100%)' : 'translateY(0)', transition: 'transform 0.3s ease' }} />
//
// Options:
//   selector  CSS selector for the scroll container. Default
//             '[data-scroll-root]' — add this attribute to the
//             outermost overflow:auto div in each view.
//   threshold Pixels of scroll-delta required before flipping state
//             (keeps tiny jitters from flickering the chrome).
//             Default 10.
//   showAboveY  Keep the chrome visible while scrollTop < this. Stops
//             the hide-on-scroll from kicking in immediately on a tap
//             near the top of a long doc. Default 56.
//   paused    When true, the hook ignores scroll events and leaves
//             `hidden` at its current value. Use this to keep the
//             nav visible while a dropdown/menu is open.
//
// Returns: boolean `hidden`. Render the chrome with a
// translateY(-100%) when hidden and a transition for the smooth
// slide-up / slide-down feel.

import { useEffect, useRef, useState } from 'react';

export default function useScrollHide({
  selector = '[data-scroll-root]',
  threshold = 10,
  showAboveY = 56,
  paused = false,
} = {}) {
  const [hidden, setHidden] = useState(false);
  const lastScrollYRef = useRef(0);
  const pausedRef = useRef(paused);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  useEffect(() => {
    let currentEl = null;

    function getScrollY() {
      if (!currentEl) return 0;
      return currentEl === window ? window.scrollY : currentEl.scrollTop;
    }

    function onScroll() {
      if (pausedRef.current) return;
      const y = getScrollY();
      const delta = y - lastScrollYRef.current;
      if (delta > threshold && y > showAboveY) {
        setHidden(true);
        lastScrollYRef.current = y;
      } else if (delta < -threshold) {
        setHidden(false);
        lastScrollYRef.current = y;
      }
    }

    function findScrollEl() {
      const el = document.querySelector(selector);
      if (el && el.scrollHeight > el.clientHeight) return el;
      // Fall back to window scrolling if no inner container is mounted
      // yet (avoids dropping events during route transitions).
      return window;
    }

    function attach() {
      const next = findScrollEl();
      if (next === currentEl) return;
      if (currentEl) currentEl.removeEventListener('scroll', onScroll);
      currentEl = next;
      currentEl.addEventListener('scroll', onScroll, { passive: true });
      lastScrollYRef.current = getScrollY();
      // Reset hidden state when the scroll root changes (route nav)
      // so the chrome doesn't stay hidden across page transitions.
      setHidden(false);
    }

    attach();

    // The scroll container changes when the user navigates between
    // views (each view has its own absolute-positioned scroll div).
    // Watch the DOM for those swaps and re-attach.
    const observer = new MutationObserver(() => attach());
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      if (currentEl) currentEl.removeEventListener('scroll', onScroll);
      observer.disconnect();
    };
  }, [selector, threshold, showAboveY]);

  return hidden;
}
