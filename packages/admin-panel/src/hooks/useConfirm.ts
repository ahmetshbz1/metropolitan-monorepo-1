import { useConfirmContext } from "../components/providers/ConfirmDialogProvider";

export const useConfirm = () => {
  const { confirm } = useConfirmContext();
  return confirm;
};
