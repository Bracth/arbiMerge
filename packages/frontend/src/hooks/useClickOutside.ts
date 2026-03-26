import { useEffect } from 'react';
import type { RefObject } from 'react';

/**
 * A hook to detect clicks outside a specified element.
 * 
 * @param ref - The ref of the element to detect clicks outside of.
 * @param handler - The callback function to execute when a click outside is detected.
 * @param active - Whether the click outside detection is active.
 */
export const useClickOutside = (
  ref: RefObject<HTMLElement | null>,
  handler: (event: MouseEvent | TouchEvent) => void,
  active: boolean = true
) => {
  useEffect(() => {
    if (!active) return;

    const listener = (event: MouseEvent | TouchEvent) => {
      const element = ref.current;

      // Do nothing if clicking ref's element or descendent elements
      if (!element || element.contains(event.target as Node)) {
        return;
      }

      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler, active]);
};
