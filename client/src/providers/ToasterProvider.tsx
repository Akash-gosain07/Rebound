import React, { createContext, useContext, useState } from 'react';

interface Toast {
  id: number;
  title: string;
  description?: string;
}

interface ToastContextValue {
  push: (toast: Omit<Toast, 'id'>) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToasterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = (toast: Omit<Toast, 'id'>) => {
    setToasts((prev) => [...prev, { ...toast, id: Date.now() }]);
    setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 3000);
  };

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed inset-x-0 bottom-4 flex justify-center z-50 pointer-events-none">
        <div className="space-y-2 w-full max-w-sm px-4">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="pointer-events-auto rounded-2xl bg-slate-900 text-white px-4 py-3 shadow-soft flex flex-col gap-1"
            >
              <span className="text-sm font-semibold">{toast.title}</span>
              {toast.description && <span className="text-xs opacity-80">{toast.description}</span>}
            </div>
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToasterProvider');
  return ctx;
}
