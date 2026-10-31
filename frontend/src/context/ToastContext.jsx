import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(() => {});

/** Bottom-right messages that disappear after 4 s, announced politely to screen readers. */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const toast = useCallback((message) => {
    const id = crypto.randomUUID();
    setToasts((list) => [...list, { id, message }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 4000);
  }, []);
  return (
    <ToastContext value={toast}>
      {children}
      <div role="status" aria-live="polite" className="fixed right-6 bottom-6 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <p key={t.id} className="rounded-md bg-primary px-4 py-3 text-sm text-on-primary shadow-sm">{t.message}</p>
        ))}
      </div>
    </ToastContext>
  );
}

export const useToast = () => useContext(ToastContext);
