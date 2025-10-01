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
    console.log("[DEBUG] handleConfirm başladı");
    if (dialogState.onConfirmAction) {
      console.log("[DEBUG] onConfirmAction var, loading true yapılıyor");
      setLoading(true);
      try {
        console.log("[DEBUG] onConfirmAction çağrılıyor...");
        await dialogState.onConfirmAction();
        console.log("[DEBUG] onConfirmAction başarılı, hideDialog çağrılıyor");
        hideDialog();
        console.log("[DEBUG] hideDialog tamamlandı");
      } catch (error) {
        console.log("[DEBUG] onConfirmAction HATA, loading false yapılıyor:", error);
        setLoading(false);
      }
    } else {
      console.log("[DEBUG] onConfirmAction yok, direkt hideDialog");
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
