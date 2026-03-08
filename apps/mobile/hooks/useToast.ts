import { useCallback, useState } from 'react';

export type ToastVariant = 'error' | 'success';

type ToastState = {
  visible: boolean;
  message: string;
  variant: ToastVariant;
};

const INITIAL_STATE: ToastState = {
  visible: false,
  message: '',
  variant: 'error',
};

export function useToast() {
  const [toast, setToast] = useState<ToastState>(INITIAL_STATE);

  const hideToast = useCallback(() => {
    setToast((previous) => ({ ...previous, visible: false }));
  }, []);

  const showToast = useCallback((message: string, variant: ToastVariant = 'error') => {
    setToast({
      visible: true,
      message,
      variant,
    });
  }, []);

  return {
    toast,
    showToast,
    hideToast,
  };
}
