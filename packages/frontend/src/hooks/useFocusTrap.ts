import { useEffect } from 'react';
import type { RefObject } from 'react';

const FOCUSABLE_ELEMENTS = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * A hook to trap keyboard focus within a ref (essential for WCAG).
 * 
 * @param ref - The ref of the container element to trap focus within.
 * @param active - Whether the focus trap is active.
 */
export const useFocusTrap = (ref: RefObject<HTMLElement | null>, active: boolean = true) => {
  useEffect(() => {
    if (!active || !ref.current) return;

    const container = ref.current;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = container.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS);
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          event.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          event.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    // Initial focus
    const focusableElements = container.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [ref, active]);
};
