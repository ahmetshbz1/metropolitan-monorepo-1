//  "useConfirmationDialog.ts"
//  metropolitan app

import { useState, useCallback } from "react";

interface ConfirmationDialogState {
  visible: boolean;
  title: string;
  message: string;
  icon?: any;
  iconColor?: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonColor?: string;
  destructive?: boolean;
  onConfirmAction?: () => void | Promise<void>;
}

export const useConfirmationDialog = () => {
  const [dialogState, setDialogState] = useState<ConfirmationDialogState>({
    visible: false,
    title: "",
    message: "",
    destructive: false,
  });
  const [loading, setLoading] = useState(false);

  const showDialog = useCallback((config: Omit<ConfirmationDialogState, "visible"> & { onConfirm: () => void | Promise<void> }) => {
    setDialogState({
      visible: true,
      title: config.title,
      message: config.message,
      icon: config.icon,
      iconColor: config.iconColor,
      confirmText: config.confirmText,
      cancelText: config.cancelText,
      confirmButtonColor: config.confirmButtonColor,
      destructive: config.destructive,
      onConfirmAction: config.onConfirm,
    });
  }, []);

  const hideDialog = useCallback(() => {
    setDialogState(prev => ({ ...prev, visible: false }));
    setLoading(false);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (dialogState.onConfirmAction) {
      setLoading(true);
      try {
        await dialogState.onConfirmAction();
        hideDialog();
      } catch (error) {
        setLoading(false);
      }
    } else {
      hideDialog();
    }
  }, [dialogState.onConfirmAction, hideDialog]);

  return {
    dialogState: {
      ...dialogState,
      loading,
    },
    showDialog,
    hideDialog,
    handleConfirm,
  };
};
