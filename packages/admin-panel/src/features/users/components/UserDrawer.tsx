import {
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
} from "@heroui/react";
import { Save, Trash2 } from "lucide-react";
import type { User, UpdateUserInput } from "../../../api/users";
import { UserDetailView } from "./UserDetailView";
import { UserEditForm } from "./UserEditForm";

interface UserDrawerProps {
  isOpen: boolean;
  user: User | null;
  editMode: boolean;
  editForm: UpdateUserInput;
  saving: boolean;
  deleting: boolean;
  onClose: () => void;
  onEditModeChange: (mode: boolean) => void;
  onFormChange: (form: UpdateUserInput) => void;
  onSave: () => void;
  onDelete: () => void;
  onCompanyUpdate?: () => void;
}

export const UserDrawer = ({
  isOpen,
  user,
  editMode,
  editForm,
  saving,
  deleting,
  onClose,
  onEditModeChange,
  onFormChange,
  onSave,
  onDelete,
  onCompanyUpdate,
}: UserDrawerProps) => {
  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      placement="right"
    >
      <DrawerContent>
        <DrawerHeader className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold">
            {editMode ? "Kullanıcı Düzenle" : "Kullanıcı Detayı"}
          </h3>
          {user && (
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {user.phoneNumber}
            </span>
          )}
        </DrawerHeader>
        <DrawerBody>
          {user && (
            editMode ? (
              <UserEditForm
                user={user}
                editForm={editForm}
                onFormChange={onFormChange}
                onCompanyUpdate={onCompanyUpdate}
              />
            ) : (
              <UserDetailView user={user} />
            )
          )}
        </DrawerBody>
        <DrawerFooter className="gap-2">
          {editMode ? (
            <>
              <Button variant="light" onPress={() => onEditModeChange(false)} isDisabled={saving}>
                İptal
              </Button>
              <Button
                color="primary"
                startContent={<Save className="h-4 w-4" />}
                onPress={onSave}
                isLoading={saving}
              >
                Kaydet
              </Button>
            </>
          ) : (
            <>
              <Button
                color="danger"
                variant="flat"
                startContent={<Trash2 className="h-4 w-4" />}
                onPress={onDelete}
                isLoading={deleting}
              >
                Sil
              </Button>
              <Button color="primary" onPress={() => onEditModeChange(true)}>
                Düzenle
              </Button>
            </>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
