import { useState, useEffect, useRef, useCallback } from 'react';

export function useTruncation() {
  const [isTruncated, setIsTruncated] = useState(false);

  // Keep a mutable reference to the element for resize/mutation listeners
  const elementRef = useRef<HTMLElement | null>(null);

  // Keep track of active observer to clean up safely
  const observerRef = useRef<MutationObserver | null>(null);

  const checkTruncation = useCallback(() => {
    const el = elementRef.current;
    if (el) {
      // For multi-line and line-clamp elements, check if content height 
      // is larger than the visible container height.
      const hasOverflow = el.scrollHeight > el.clientHeight;
      setIsTruncated(hasOverflow);
    }
  }, []);

  // Use a callback ref instead of a standard useRef object.
  // React calls this function with the DOM element when it mounts, 
  // and with 'null' when it unmounts.
  const setRef = useCallback((node: HTMLElement | null) => {
    // Clean up old listeners if the node is changing or unmounting
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    window.removeEventListener('resize', checkTruncation);

    // Save the new node reference
    elementRef.current = node;

    // If a new node mounted, attach fresh observers and calculate
    if (node) {
      checkTruncation();
      window.addEventListener('resize', checkTruncation);

      const observer = new MutationObserver(checkTruncation);
      observer.observe(node, { childList: true, characterData: true, subtree: true });
      observerRef.current = observer;
    }
  }, [checkTruncation]);

  // Global clean-up when the parent component completely unmounts
  useEffect(() => {
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
      window.removeEventListener('resize', checkTruncation);
    };
  }, [checkTruncation]);

  // Return setRef instead of elementRef
  return { setRef, isTruncated };
}