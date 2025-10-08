import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, type Selection } from "@heroui/react";
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
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set<string>());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
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

  const areSetsEqual = useCallback((a: Set<string>, b: Set<string>) => {
    if (a.size !== b.size) {
      return false;
    }
    for (const value of a) {
      if (!b.has(value)) {
        return false;
      }
    }
    return true;
  }, []);

  useEffect(() => {
    const availableIds = new Set(users.map((user) => user.id));
    const filtered = new Set<string>(Array.from(selectedUserIds).filter((id) => availableIds.has(id)));
    if (!areSetsEqual(filtered, selectedUserIds)) {
      setSelectedUserIds(filtered);
    }
  }, [users, selectedUserIds, areSetsEqual]);

  const selectedUsers = useMemo(
    () => users.filter((user) => selectedUserIds.has(user.id)),
    [users, selectedUserIds]
  );

  const clearSelection = useCallback(() => {
    setSelectedUserIds(new Set<string>());
  }, []);

  const handleSelectionChange = useCallback(
    (keys: Selection) => {
      const normalized =
        keys === "all"
          ? new Set<string>(users.map((user) => user.id))
          : new Set<string>(Array.from(keys as Set<string>));
      setSelectedUserIds(normalized);
    },
    [users]
  );

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
      setSelectedUserIds((current) => {
        const next = new Set(current);
        next.delete(selectedUser.id);
        return next;
      });
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

  const handleBulkDelete = useCallback(async () => {
    if (selectedUsers.length === 0) {
      return;
    }

    const confirmed = await confirm({
      title: "Seçilen kullanıcıları sil",
      description: `${selectedUsers.length} kullanıcıyı kalıcı olarak silmek istediğinize emin misiniz?`,
      confirmLabel: "Sil",
      cancelLabel: "Vazgeç",
      tone: "danger",
    });

    if (!confirmed) {
      return;
    }

    try {
      setIsBulkDeleting(true);
      const results = await Promise.allSettled(
        selectedUsers.map(async (user) => {
          await deleteUser(user.id);
          return user;
        })
      );

      const succeeded = results.filter(
        (result): result is PromiseFulfilledResult<User> => result.status === "fulfilled"
      );
      const failed = results.filter(
        (result): result is PromiseRejectedResult => result.status === "rejected"
      );

      if (succeeded.length > 0) {
        await loadUsers();
        showToast({
          type: "success",
          title: "Kullanıcılar silindi",
          description: `${succeeded.length} kullanıcı kaldırıldı.`,
        });
      }

      if (failed.length > 0) {
        console.error("Toplu kullanıcı silme hataları:", failed);
        showToast({
          type: "error",
          title: "Bazı kullanıcılar silinemedi",
          description: `${failed.length} kullanıcı silinemedi, ayrıntılar için günlükleri kontrol edin.`,
        });
      }
    } finally {
      setIsBulkDeleting(false);
      clearSelection();
    }
  }, [clearSelection, confirm, loadUsers, selectedUsers, showToast]);

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

      <UserTable
        users={users}
        loading={loading}
        onUserSelect={handleUserSelect}
        selectedKeys={selectedUserIds}
        onSelectionChange={handleSelectionChange}
      />

      {selectedUsers.length > 0 ? (
        <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-[#2a2a2a] dark:bg-[#161616] dark:text-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-semibold">Seçilen kullanıcı: {selectedUsers.length}</span>
            <div className="flex flex-wrap gap-2">
              <Button variant="flat" onPress={clearSelection} className="min-w-[140px]">
                Seçimi Temizle
              </Button>
              <Button
                color="danger"
                variant="solid"
                onPress={() => void handleBulkDelete()}
                isLoading={isBulkDeleting}
                className="min-w-[160px]"
              >
                Seçilenleri Sil
              </Button>
            </div>
          </div>
        </div>
      ) : null}

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
