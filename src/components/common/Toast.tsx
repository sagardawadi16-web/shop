import React, { useEffect, useState } from 'react';
import { CheckCircle, X } from 'lucide-react';

interface ToastMessage { id: number; text: string; type?: 'success' | 'error' | 'info'; }

let toastId = 0;
type ToastListener = (t: ToastMessage) => void;
const listeners: ToastListener[] = [];

export const toast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
  const msg: ToastMessage = { id: ++toastId, text, type };
  listeners.forEach((fn) => fn(msg));
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const listener: ToastListener = (msg) => {
      setToasts((prev) => [...prev, msg]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== msg.id)), 3500);
    };
    listeners.push(listener);
    return () => { const idx = listeners.indexOf(listener); if (idx > -1) listeners.splice(idx, 1); };
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="toast animate-fadeInUp"
          style={{
            background: t.type === 'error' ? '#7F1D1D' : t.type === 'info' ? '#1E3A5F' : '#2B1810',
            display: 'flex', alignItems: 'center', gap: 10
          }}
        >
          {t.type !== 'error' && <CheckCircle size={16} style={{ color: '#D4AF37', flexShrink: 0 }} />}
          {t.text}
          <button onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))} style={{ marginLeft: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', display: 'flex' }}>
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
