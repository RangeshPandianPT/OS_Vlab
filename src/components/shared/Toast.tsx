import React, { useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={18} className="text-green-500 flex-shrink-0" />,
  error:   <AlertCircle  size={18} className="text-red-500 flex-shrink-0" />,
  info:    <Info         size={18} className="text-blue-400 flex-shrink-0" />,
  warning: <AlertTriangle size={18} className="text-yellow-500 flex-shrink-0" />,
};

const bgColors: Record<ToastType, string> = {
  success: 'border-green-500/30',
  error:   'border-red-500/30',
  info:    'border-blue-400/30',
  warning: 'border-yellow-500/30',
};

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => (
  <div
    className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-card bg-panel border ${bgColors[toast.type]} min-w-[240px] max-w-sm`}
  >
    {icons[toast.type]}
    <p className="flex-1 text-sm text-text-primary font-medium">{toast.message}</p>
    <button
      onClick={() => onDismiss(toast.id)}
      className="text-text-muted hover:text-text-primary transition-colors"
    >
      <X size={16} />
    </button>
  </div>
);

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts(prev => [...prev, { id, message, type }]);
    // auto-dismiss after 4 s
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, showToast, dismissToast };
}
