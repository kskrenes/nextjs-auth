import { useState, useEffect, useRef, useCallback } from 'react';

export function useTruncation() {
  const [isTruncated, setIsTruncated] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);

  const checkTruncation = useCallback(() => {
    const el = elementRef.current;
    if (el) {
      // For multi-line and line-clamp elements, check if content height 
      // is larger than the visible container height.
      const hasOverflow = el.scrollHeight > el.clientHeight;
      setIsTruncated(hasOverflow);
    }
  }, []);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    // Trigger check immediately and on window resize
    checkTruncation();
    window.addEventListener('resize', checkTruncation);

    // Watch for internal text changes if content updates dynamically
    const observer = new MutationObserver(checkTruncation);
    observer.observe(el, { childList: true, characterData: true, subtree: true });

    return () => {
      window.removeEventListener('resize', checkTruncation);
      observer.disconnect();
    };
  }, [checkTruncation]);

  return { elementRef, isTruncated };
}