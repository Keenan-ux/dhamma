// Hook that wires simultaneous Pāli/English highlight inside the
// reader. Attaches mouseover / mouseout listeners to the supplied
// container ref; when the pointer enters a [data-segment] element,
// every element on the page with the same data-passage-id +
// data-segment gets a .dhamma-seg-hover class applied. Pointer leave
// removes it.
//
// Uses native DOM mutation instead of React state so hover doesn't
// trigger a re-render of the (potentially large) reader tree.

import { useEffect } from 'react';

export default function useSegmentHover(containerRef) {
  useEffect(() => {
    const root = containerRef?.current;
    if (!root) return;

    let activePeers = [];

    function clear() {
      for (const el of activePeers) el.classList.remove('dhamma-seg-hover');
      activePeers = [];
    }

    function onOver(e) {
      const seg = e.target.closest?.('[data-segment][data-passage-id]');
      if (!seg) return clear();
      const segKey = seg.getAttribute('data-segment');
      const passageId = seg.getAttribute('data-passage-id');
      if (!segKey || !passageId) return clear();
      // Find every sister-segment with the same key + passage id
      // (typically two: the Pāli span and the English span). Apply
      // the hover class to all of them, including the element the
      // pointer is on.
      const sel = `[data-segment="${cssEscape(segKey)}"][data-passage-id="${cssEscape(passageId)}"]`;
      const peers = root.querySelectorAll(sel);
      // Avoid churn if hovering inside the same group.
      if (activePeers.length === peers.length && activePeers.every((p, i) => p === peers[i])) {
        return;
      }
      clear();
      activePeers = Array.from(peers);
      for (const el of activePeers) el.classList.add('dhamma-seg-hover');
    }

    function onOut(e) {
      // Only clear when leaving the reader entirely, not when moving
      // between segments. The next onOver will re-apply.
      const to = e.relatedTarget;
      if (to && root.contains(to)) return;
      clear();
    }

    root.addEventListener('mouseover', onOver);
    root.addEventListener('mouseout', onOut);
    return () => {
      root.removeEventListener('mouseover', onOver);
      root.removeEventListener('mouseout', onOut);
      clear();
    };
  }, [containerRef]);
}

// CSS.escape isn't on every browser surface in older Safari. Fall
// back to a minimal escape that covers our segment-key alphabet
// ("0-9", ".") and passage-id alphabet (letters, digits, hyphen,
// dot, colon).
function cssEscape(s) {
  if (typeof CSS !== 'undefined' && CSS.escape) return CSS.escape(s);
  return String(s).replace(/([^\w-])/g, '\\$1');
}
