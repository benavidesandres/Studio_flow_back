import { create } from 'zustand';

export interface ToastItem {
  id: number;
  message: string;
  tone: 'success' | 'error';
}

export const useToasts = create<{ toasts: ToastItem[] }>(() => ({ toasts: [] }));

let nextId = 0;

export const toast = (message: string, tone: ToastItem['tone'] = 'success') => {
  const id = ++nextId;
  useToasts.setState((state) => ({ toasts: [...state.toasts, { id, message, tone }] }));
  window.setTimeout(() => {
    useToasts.setState((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) }));
  }, 4500);
};
