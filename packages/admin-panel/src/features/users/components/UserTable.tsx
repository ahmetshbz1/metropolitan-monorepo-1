import {
  Button,
  Card,
  CardBody,
  Chip,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  type Selection,
} from "@heroui/react";
import type { User } from "../../../api/users";

interface UserTableProps {
  users: User[];
  loading: boolean;
  onUserSelect: (user: User) => void;
  selectedKeys?: Set<string>;
  onSelectionChange?: (keys: Selection) => void;
  selectionMode?: "single" | "multiple";
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getUserTypeChip = (userType: string) => {
  return (
    <Chip
      color={userType === "corporate" ? "secondary" : "primary"}
      size="sm"
      variant="flat"
    >
      {userType === "corporate" ? "Kurumsal" : "Bireysel"}
    </Chip>
  );
};

export const UserTable = ({
  users,
  loading,
  onUserSelect,
  selectedKeys,
  onSelectionChange,
  selectionMode = "multiple",
}: UserTableProps) => {
  return (
    <Card className="dark:bg-[#1a1a1a] dark:border dark:border-[#2a2a2a]">
      <CardBody>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" color="primary" />
          </div>
        ) : (
          <Table
            aria-label="Kullanıcılar tablosu"
            selectionMode={selectionMode}
            selectedKeys={selectedKeys}
            onSelectionChange={onSelectionChange}
          >
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
                    <Button size="sm" variant="flat" onPress={() => onUserSelect(user)}>
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
  );
};
