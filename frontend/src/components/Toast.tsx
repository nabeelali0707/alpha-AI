'use client';

import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    timerRef.current[id] = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      delete timerRef.current[id];
    }, 4000);
  }, []);

  useEffect(() => {
    return () => {
      Object.values(timerRef.current).forEach(clearTimeout);
    };
  }, []);

  const colorMap: Record<ToastType, string> = {
    success: '#00ff41',
    error: '#ff3131',
    info: '#3b82f6',
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              background: 'rgba(15,22,41,0.97)',
              border: `1px solid ${colorMap[t.type]}40`,
              borderLeft: `3px solid ${colorMap[t.type]}`,
              borderRadius: 10,
              padding: '12px 18px',
              color: '#e5e7eb',
              fontSize: 14,
              maxWidth: 340,
              backdropFilter: 'blur(16px)',
              boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 12px ${colorMap[t.type]}20`,
              animation: 'fadeInUp 0.35s cubic-bezier(0.34,1.56,0.64,1)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span style={{ color: colorMap[t.type], fontSize: 16 }}>
              {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
