import { useToastContext } from "../components/providers/ToastProvider";

export const useToast = () => {
  const { showToast } = useToastContext();
  return { showToast };
};
