// RESKIN ONLY — Logic untouched. UI layer updated per Agri-Tech spec.
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, CheckCircle, XCircle, X } from 'lucide-react';

type ToastType = 'info' | 'success' | 'error';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/* INJECT LOGIC HERE — DO NOT REMOVE */
export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };
  /* END LOGIC */

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-3 w-[90%] max-w-sm pointer-events-none"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="pointer-events-auto w-full"
            >
              <div className={`flex items-center gap-3 p-4 rounded-2xl border ${
                toast.type === 'success'
                  ? 'bg-agri-green/10 border-agri-green/30'
                  : toast.type === 'error'
                  ? 'bg-agri-terra/10 border-agri-terra/30'
                  : 'bg-agri-amber/10 border-agri-amber/30'
              }`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  toast.type === 'success'
                    ? 'bg-agri-green/10 text-agri-green'
                    : toast.type === 'error'
                    ? 'bg-agri-terra/10 text-agri-terra'
                    : 'bg-agri-amber/10 text-agri-amber'
                }`}>
                  {toast.type === 'success'
                    ? <CheckCircle className="w-5 h-5" />
                    : toast.type === 'error'
                    ? <XCircle className="w-5 h-5" />
                    : <Info className="w-5 h-5" />
                  }
                </div>
                <div className="flex-grow min-w-0">
                  <p className={`text-sm font-medium capitalize ${
                    toast.type === 'success' ? 'text-agri-green'
                    : toast.type === 'error' ? 'text-agri-terra'
                    : 'text-agri-amber'
                  }`}>{toast.type}</p>
                  <p className="text-xs text-agri-soil-deep/70 mt-0.5 truncate">{toast.message}</p>
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  aria-label="Dismiss notification"
                  className="text-agri-soil/50 hover:text-agri-soil-deep transition-colors focus:outline-none focus:ring-2 focus:ring-agri-green focus:ring-offset-1 rounded p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

/*
 * Changes Made:
 * - Dark zinc → agri-offwhite tinted surfaces per toast type
 * - Success: agri-green, Error: agri-terra, Info: agri-amber
 * - AlertCircle → XCircle for error (more semantic)
 * - role="status" aria-live="polite" for screen readers
 * - Dismiss button aria-label + focus ring
 */
