import { useEffect, useState } from "react";
import { Button } from "@heroui/react";
import { Users, RefreshCw } from "lucide-react";
import { getUsers, updateUser, deleteUser } from "../../api/users";
import type { User, UserFilters as UserFiltersType, UpdateUserInput } from "../../api/users";
import { UserFilters } from "./components/UserFilters";
import { UserTable } from "./components/UserTable";
import { UserDrawer } from "./components/UserDrawer";
import { useConfirm } from "../../hooks/useConfirm";
import { useToast } from "../../hooks/useToast";

export const UserManager = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<UserFiltersType>({});
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editForm, setEditForm] = useState<UpdateUserInput>({});
  const confirm = useConfirm();
  const { showToast } = useToast();

  useEffect(() => {
    loadUsers();
  }, [filters]);

  useEffect(() => {
    if (selectedUser && editMode) {
      setEditForm({
        phoneNumber: selectedUser.phoneNumber,
        phoneNumberVerified: selectedUser.phoneNumberVerified,
        firstName: selectedUser.firstName,
        lastName: selectedUser.lastName,
        email: selectedUser.email,
        userType: selectedUser.userType,
        companyId: selectedUser.companyId,
        profilePhotoUrl: selectedUser.profilePhotoUrl,
        marketingConsent: selectedUser.marketingConsent,
        shareDataWithPartners: selectedUser.shareDataWithPartners,
        analyticsData: selectedUser.analyticsData,
        smsNotifications: selectedUser.smsNotifications,
        pushNotifications: selectedUser.pushNotifications,
        emailNotifications: selectedUser.emailNotifications,
      });
    }
  }, [selectedUser, editMode]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await getUsers(filters);
      setUsers(response.users);
    } catch (error) {
      console.error("Kullanıcılar yüklenemedi:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setFilters({ ...filters, search: searchInput || undefined });
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setEditMode(false);
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!selectedUser) return;

    try {
      setSaving(true);
      await updateUser(selectedUser.id, editForm);
      await loadUsers();
      setEditMode(false);
      setDrawerOpen(false);
      setSelectedUser(null);
      showToast({ type: "success", title: "Kullanıcı güncellendi" });
    } catch (error) {
      console.error("Kullanıcı güncellenemedi:", error);
      showToast({
        type: "error",
        title: "Güncelleme başarısız",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    const confirmed = await confirm({
      title: "Kullanıcıyı Sil",
      description: `${selectedUser.phoneNumber} numaralı kullanıcıyı silmek istediğinize emin misiniz?`,
      confirmLabel: "Sil",
      cancelLabel: "Vazgeç",
      tone: "danger",
    });

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      await deleteUser(selectedUser.id);
      await loadUsers();
      setDrawerOpen(false);
      setSelectedUser(null);
      setEditMode(false);
      showToast({ type: "success", title: "Kullanıcı silindi" });
    } catch (error) {
      console.error("Kullanıcı silinemedi:", error);
      showToast({
        type: "error",
        title: "Silme başarısız",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setEditMode(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Kullanıcılar</h1>
        </div>
        <Button
          startContent={<RefreshCw className="h-4 w-4" />}
          onPress={loadUsers}
          isLoading={loading}
          variant="flat"
        >
          Yenile
        </Button>
      </div>

      <UserFilters
        filters={filters}
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        onFiltersChange={setFilters}
        onSearch={handleSearch}
      />

      <UserTable users={users} loading={loading} onUserSelect={handleUserSelect} />

      <UserDrawer
        isOpen={drawerOpen}
        user={selectedUser}
        editMode={editMode}
        editForm={editForm}
        saving={saving}
        deleting={deleting}
        onClose={handleCloseDrawer}
        onEditModeChange={setEditMode}
        onFormChange={setEditForm}
        onSave={handleSave}
        onDelete={handleDelete}
        onCompanyUpdate={loadUsers}
      />
    </div>
  );
};
