// useToast.tsx
// metropolitan app
// Created by Ahmet on 21.07.2025.

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Toast } from '../components/common/Toast';

interface ToastMessage {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  actionLabel?: string;
  onActionPress?: () => void;
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info', duration?: number, actionLabel?: string, onActionPress?: () => void) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info',
    duration: number = 3000,
    actionLabel?: string,
    onActionPress?: () => void
  ) => {
    const id = Date.now().toString();
    // Yeni toast geldiğinde eskileri temizle, sadece yeni toast'ı göster
    setToasts([{ id, message, type, duration, actionLabel, onActionPress }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          visible={true}
          onClose={() => removeToast(toast.id)}
          actionLabel={toast.actionLabel}
          onActionPress={toast.onActionPress}
        />
      ))}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}