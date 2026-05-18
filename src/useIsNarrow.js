import { useEffect, useState } from 'react';

// Returns true when viewport is narrow enough to collapse the sidebar.
// Components decide what to render rather than fighting inline-style vs CSS.
export default function useIsNarrow(breakpoint = 880) {
  const [narrow, setNarrow] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth <= breakpoint
  );
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const handler = (e) => setNarrow(e.matches);
    setNarrow(mq.matches);
    if (mq.addEventListener) mq.addEventListener('change', handler);
    else mq.addListener(handler);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', handler);
      else mq.removeListener(handler);
    };
  }, [breakpoint]);
  return narrow;
}
