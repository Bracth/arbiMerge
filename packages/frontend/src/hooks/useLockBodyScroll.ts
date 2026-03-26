import { useLayoutEffect } from 'react';

/**
 * A hook to prevent background scrolling when the modal is open.
 * 
 * @param active - Whether the body scroll lock is active.
 */
export const useLockBodyScroll = (active: boolean = true) => {
  useLayoutEffect(() => {
    if (!active) return;

    // Get original body overflow
    const originalStyle = window.getComputedStyle(document.body).overflow;

    // Prevent scrolling on mount
    document.body.style.overflow = 'hidden';

    // Re-enable scrolling when component unmounts
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [active]);
};
