/**
 * Lightweight, dependency-free toast system.
 *
 * Public surface:
 *   <ToastProvider> wraps the app (already mounted in UserAppShell).
 *   const { push } = useToast();   // push({ type, title, message, duration? })
 *   const { dismiss } = useToast();
 *
 * Toasts auto-dismiss after `duration` ms (default 5000); set duration=0 for sticky.
 * Rendered through `createPortal` to escape any local stacking context.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import "./Toast.css";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const tid = timers.current.get(id);
    if (tid) {
      clearTimeout(tid);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    ({ type = "info", title, message, duration = 5000 } = {}) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, type, title, message }]);
      if (duration > 0) {
        const tid = setTimeout(() => dismiss(id), duration);
        timers.current.set(id, tid);
      }
      return id;
    },
    [dismiss]
  );

  useEffect(
    () => () => {
      timers.current.forEach((tid) => clearTimeout(tid));
      timers.current.clear();
    },
    []
  );

  const value = useMemo(() => ({ push, dismiss }), [push, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="toast-stack" role="region" aria-label="Notifications">
          {toasts.map((t) => (
            <div
              key={t.id}
              role={t.type === "error" ? "alert" : "status"}
              className={`toast toast--${t.type}`}
            >
              <div className="toast__body">
                {t.title ? <p className="toast__title">{t.title}</p> : null}
                {t.message ? <p className="toast__message">{t.message}</p> : null}
              </div>
              <button
                type="button"
                className="toast__close"
                aria-label="Dismiss notification"
                onClick={() => dismiss(t.id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return { push: () => null, dismiss: () => null };
  }
  return ctx;
};
