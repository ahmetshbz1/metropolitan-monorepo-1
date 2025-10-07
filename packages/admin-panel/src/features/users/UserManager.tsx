import { useEffect, useState } from "react";
import {
  Card,
  CardBody,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Button,
  Select,
  SelectItem,
  Spinner,
  Input,
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  Divider,
  type Selection,
} from "@heroui/react";
import { Users, Search, RefreshCw } from "lucide-react";
import { getUsers } from "../../api/users";
import type { User, UserFilters } from "../../api/users";

const USER_TYPES = [
  { value: "individual", label: "Bireysel", color: "primary" },
  { value: "corporate", label: "Kurumsal", color: "secondary" },
];

export const UserManager = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<UserFilters>({});
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    loadUsers();
  }, [filters]);

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

  const getUserTypeChip = (userType: string) => {
    const typeObj = USER_TYPES.find((t) => t.value === userType);
    return (
      <Chip color={typeObj?.color as "primary" | "secondary"} size="sm" variant="flat">
        {typeObj?.label || userType}
      </Chip>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAuthProvider = (provider: string | null): string => {
    if (!provider) {
      return "Telefon";
    }

    switch (provider.toLowerCase()) {
      case "google":
        return "Google";
      case "apple":
        return "Apple";
      default:
        return provider;
    }
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

      <Card className="dark:bg-[#1a1a1a] dark:border dark:border-[#2a2a2a]">
        <CardBody className="gap-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Select
              label="Kullanıcı Tipi"
              placeholder="Tümü"
              selectedKeys={filters.userType ? new Set<Selection>([filters.userType]) : new Set()}
              onSelectionChange={(keys) => {
                if (keys === "all" || keys.size === 0) {
                  setFilters({ ...filters, userType: undefined });
                  return;
                }

                const [value] = keys;
                setFilters({ ...filters, userType: value as string });
              }}
              classNames={{
                trigger: "dark:bg-[#0a0a0a] dark:border-[#2a2a2a]",
              }}
            >
              {USER_TYPES.map((type) => (
                <SelectItem key={type.value}>{type.label}</SelectItem>
              ))}
            </Select>

            <div className="flex gap-2 md:col-span-2">
              <Input
                placeholder="İsim, email veya telefon ara..."
                value={searchInput}
                onValueChange={setSearchInput}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
                startContent={<Search className="h-4 w-4 text-slate-400" />}
                classNames={{
                  inputWrapper: "dark:bg-[#0a0a0a] dark:border-[#2a2a2a]",
                }}
              />
              <Button onPress={handleSearch} variant="flat">
                Ara
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="dark:bg-[#1a1a1a] dark:border dark:border-[#2a2a2a]">
        <CardBody>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Spinner size="lg" color="primary" />
            </div>
          ) : (
            <Table aria-label="Kullanıcılar tablosu">
              <TableHeader>
                <TableColumn>AD SOYAD</TableColumn>
                <TableColumn>TELEFON</TableColumn>
                <TableColumn>E-POSTA</TableColumn>
                <TableColumn>TİP</TableColumn>
                <TableColumn>ŞİRKET</TableColumn>
                <TableColumn>DOĞRULAMA</TableColumn>
                <TableColumn>KAYIT TARİHİ</TableColumn>
                <TableColumn>İŞLEM</TableColumn>
              </TableHeader>
              <TableBody emptyContent="Kullanıcı bulunamadı">
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {user.firstName || user.lastName
                            ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                            : "-"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs">{user.phoneNumber}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{user.email || "-"}</span>
                    </TableCell>
                    <TableCell>{getUserTypeChip(user.userType)}</TableCell>
                    <TableCell>
                      <span className="text-sm">{user.companyName || "-"}</span>
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={user.phoneNumberVerified ? "success" : "warning"}
                        size="sm"
                        variant="flat"
                      >
                        {user.phoneNumberVerified ? "Doğrulandı" : "Bekliyor"}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs">{formatDate(user.createdAt)}</span>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="flat"
                        onPress={() => {
                          setSelectedUser(user);
                          setDrawerOpen(true);
                        }}
                      >
                        Detay
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} size="2xl" placement="right">
        <DrawerContent>
          <DrawerHeader className="flex flex-col gap-1">
            <h3 className="text-lg font-semibold">Kullanıcı Detayı</h3>
            {selectedUser && (
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {selectedUser.phoneNumber}
              </span>
            )}
          </DrawerHeader>
          <DrawerBody>
            {selectedUser && (
              <div className="space-y-6">
                <div>
                  <h4 className="mb-3 text-sm font-semibold">Kişisel Bilgiler</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Ad Soyad:</span>{" "}
                      <span className="font-medium">
                        {selectedUser.firstName || selectedUser.lastName
                          ? `${selectedUser.firstName || ""} ${selectedUser.lastName || ""}`.trim()
                          : "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">E-posta:</span>{" "}
                      <span className="font-medium">{selectedUser.email || "-"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Telefon:</span>{" "}
                      <span className="font-medium">{selectedUser.phoneNumber}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 dark:text-slate-400">Telefon Doğrulama:</span>
                      <Chip
                        color={selectedUser.phoneNumberVerified ? "success" : "warning"}
                        size="sm"
                        variant="flat"
                      >
                        {selectedUser.phoneNumberVerified ? "Doğrulandı" : "Bekliyor"}
                      </Chip>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Giriş Yöntemi:</span>{" "}
                      <span className="font-medium">{formatAuthProvider(selectedUser.authProvider)}</span>
                    </div>
                  </div>
                </div>

                <Divider />

                <div>
                  <h4 className="mb-3 text-sm font-semibold">Hesap Bilgileri</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 dark:text-slate-400">Kullanıcı Tipi:</span>
                      {getUserTypeChip(selectedUser.userType)}
                    </div>
                    {selectedUser.userType === "corporate" && (
                      <>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Şirket Adı:</span>{" "}
                          <span className="font-medium">{selectedUser.companyName || "-"}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">NIP:</span>{" "}
                          <span className="font-medium">{selectedUser.companyNip || "-"}</span>
                        </div>
                      </>
                    )}
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Pazarlama İzni:</span>{" "}
                      <Chip
                        color={selectedUser.marketingConsent ? "success" : "default"}
                        size="sm"
                        variant="flat"
                      >
                        {selectedUser.marketingConsent ? "Var" : "Yok"}
                      </Chip>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Kayıt Tarihi:</span>{" "}
                      <span className="font-medium">{formatDate(selectedUser.createdAt)}</span>
                    </div>
                    {selectedUser.deletedAt && (
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Silinme Tarihi:</span>{" "}
                        <span className="font-medium text-red-600">
                          {formatDate(selectedUser.deletedAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </div>
  );
};
