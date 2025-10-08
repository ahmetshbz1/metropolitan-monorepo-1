import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";

type ConfirmTone = "primary" | "danger";

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
}

interface ConfirmDialogContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | undefined>(undefined);

export const ConfirmDialogProvider = ({ children }: { children: ReactNode }) => {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const closeDialog = useCallback((result: boolean) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setOptions(null);
  }, []);

  const confirm = useCallback((config: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setOptions({
        confirmLabel: "Onayla",
        cancelLabel: "Vazgeç",
        tone: "primary",
        ...config,
      });
    });
  }, []);

  const contextValue = useMemo<ConfirmDialogContextValue>(() => ({ confirm }), [confirm]);

  const handleCancel = useCallback(() => closeDialog(false), [closeDialog]);
  const handleConfirm = useCallback(() => closeDialog(true), [closeDialog]);

  return (
    <ConfirmDialogContext.Provider value={contextValue}>
      {children}
      <Modal isOpen={Boolean(options)} onClose={handleCancel} size="sm" placement="center">
        <ModalContent>
          {() => (
            options ? (
              <>
                <ModalHeader>{options.title}</ModalHeader>
                <ModalBody>
                  {options.description ? (
                    <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {options.description}
                    </p>
                  ) : null}
                </ModalBody>
                <ModalFooter>
                  <Button variant="light" onPress={handleCancel}>
                    {options.cancelLabel}
                  </Button>
                  <Button
                    color={options.tone === "danger" ? "danger" : "primary"}
                    onPress={handleConfirm}
                  >
                    {options.confirmLabel}
                  </Button>
                </ModalFooter>
              </>
            ) : null
          )}
        </ModalContent>
      </Modal>
    </ConfirmDialogContext.Provider>
  );
};

export const useConfirmContext = () => {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error("useConfirmContext yalnızca ConfirmDialogProvider içinde kullanılabilir");
  }
  return context;
};
