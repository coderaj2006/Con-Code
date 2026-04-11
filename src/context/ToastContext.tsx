import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, CheckCircle, AlertCircle, X } from 'lucide-react';

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

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-3 w-[90%] max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="pointer-events-auto"
            >
              <div className={`flex items-center gap-4 p-4 rounded-3xl shadow-2xl backdrop-blur-xl border ${
                toast.type === 'success' ? 'bg-emerald-900/90 border-emerald-500/30' :
                toast.type === 'error' ? 'bg-red-900/90 border-red-500/30' :
                'bg-zinc-900/90 border-zinc-700'
              }`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                  toast.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/20 text-emerald-500' :
                  toast.type === 'error' ? 'bg-red-500/20 border-red-500/20 text-red-500' :
                  'bg-amber-500/20 border-amber-500/20 text-amber-500'
                }`}>
                  {toast.type === 'success' ? <CheckCircle className="w-6 h-6" /> :
                   toast.type === 'error' ? <AlertCircle className="w-6 h-6" /> :
                   <Info className="w-6 h-6" />}
                </div>
                <div className="flex-grow">
                  <p className="text-white font-black text-sm uppercase tracking-tight">{toast.type === 'info' ? 'Update' : toast.type}</p>
                  <p className="text-zinc-400 text-[10px] font-bold uppercase mt-0.5">{toast.message}</p>
                </div>
                <button onClick={() => removeToast(toast.id)} className="text-zinc-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
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
