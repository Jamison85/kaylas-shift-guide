import { useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";

export default function Modal({ className, label, labelledBy, onClose, returnFocus, children }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const dialog = ref.current;
    const opener = returnFocus?.current || document.activeElement;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    // Keep the existing autofocus choices (input, close button, or safe reset choice).
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [returnFocus]);

  const keepFocus = (event) => {
    if (event.key !== "Tab") return;
    const controls = ref.current.querySelectorAll("button:enabled, input:enabled, a[href]");
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return createPortal(
    <dialog ref={ref} className={className} aria-label={label} aria-labelledby={labelledBy}
      onKeyDown={keepFocus}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      {children}
    </dialog>,
    document.body
  );
}
