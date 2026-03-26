import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useId,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';

interface ModalContextType {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onClose: () => void;
  modalId: string;
  titleId: string;
  descriptionId: string;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('Modal compound components must be used within a Modal provider');
  }
  return context;
};

interface ModalProps {
  children: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Modal Provider component that manages the open state and accessibility IDs.
 */
export const Modal = ({
  children,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
}: ModalProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

  const modalId = useId();
  const titleId = useId();
  const descriptionId = useId();

  const setIsOpen = useCallback(
    (value: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(value);
      }
      onOpenChange?.(value);
    },
    [isControlled, onOpenChange]
  );

  const onClose = useCallback(() => setIsOpen(false), [setIsOpen]);

  return (
    <ModalContext.Provider
      value={{
        isOpen,
        setIsOpen,
        onClose,
        modalId,
        titleId,
        descriptionId,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};

interface ModalTriggerProps {
  children: React.ReactElement;
  asChild?: boolean;
}

/**
 * Component that triggers the modal to open.
 */
Modal.Trigger = function ModalTrigger({ children }: ModalTriggerProps) {
  const { setIsOpen } = useModal();

  return React.cloneElement(children as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>, {
    onClick: (e: React.MouseEvent) => {
      (children as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>).props.onClick?.(e);
      setIsOpen(true);
    },
  });
};

interface ModalContentProps {
  children: ReactNode;
  className?: string;
}

/**
 * The portal-wrapped content of the modal with accessibility and animations.
 */
Modal.Content = function ModalContent({ children, className = '' }: ModalContentProps) {
  const { isOpen, onClose, modalId, titleId, descriptionId } = useModal();
  const contentRef = useRef<HTMLDivElement>(null);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  // Ensure modal-root exists
  useEffect(() => {
    let root = document.getElementById('modal-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'modal-root';
      document.body.appendChild(root);
    }
    setPortalRoot(root);
  }, []);

  // Accessibility hooks
  useFocusTrap(contentRef, isOpen);
  useClickOutside(contentRef, onClose, isOpen);
  useLockBodyScroll(isOpen);

  // ESC key to close
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !portalRoot) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      aria-hidden="true"
    >
      <div
        ref={contentRef}
        id={modalId}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={`relative w-full max-w-lg bg-surface-container border border-outline-variant shadow-2xl animate-zoom-in overflow-hidden ${className}`}
      >
        {children}
      </div>
    </div>,
    portalRoot
  );
};

interface ModalHeaderProps {
  children: ReactNode;
  className?: string;
  showCloseButton?: boolean;
}

/**
 * Structural component for the modal header.
 */
Modal.Header = function ModalHeader({
  children,
  className = '',
  showCloseButton = true,
}: ModalHeaderProps) {
  const { onClose, titleId } = useModal();

  return (
    <div
      className={`flex items-center justify-between p-6 border-b border-outline-variant ${className}`}
    >
      <h2 id={titleId} className="text-xl font-headline font-semibold text-on-surface">
        {children}
      </h2>
      {showCloseButton && (
        <button
          onClick={onClose}
          className="p-2 -mr-2 text-on-surface-variant hover:text-on-surface transition-colors"
          aria-label="Close modal"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
};

interface ModalBodyProps {
  children: ReactNode;
  className?: string;
}

/**
 * Structural component for the modal body, memoized for performance.
 */
Modal.Body = React.memo(function ModalBody({ children, className = '' }: ModalBodyProps) {
  const { descriptionId } = useModal();
  return (
    <div id={descriptionId} className={`p-6 overflow-y-auto max-h-[70vh] ${className}`}>
      {children}
    </div>
  );
});

interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

/**
 * Structural component for the modal footer.
 */
Modal.Footer = function ModalFooter({ children, className = '' }: ModalFooterProps) {
  return (
    <div
      className={`flex items-center justify-end gap-3 p-6 border-t border-outline-variant bg-surface-container-low ${className}`}
    >
      {children}
    </div>
  );
};
