import { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
  duration?: number;
}

const toastStyles: Record<ToastType, { bg: string; icon: string }> = {
  success: { bg: 'bg-green-600', icon: '✓' },
  error: { bg: 'bg-red-600', icon: '✕' },
  info: { bg: 'bg-blue-600', icon: 'ℹ' },
  warning: { bg: 'bg-orange-600', icon: '⚠' },
};

const Toast = ({ message, type = 'success', onClose, duration = 3000 }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const style = toastStyles[type];

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
      <div className={`${style.bg} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3`}>
        <span className="text-xl">{style.icon}</span>
        <span className="font-medium">{message}</span>
      </div>
    </div>
  );
};

export default Toast;
