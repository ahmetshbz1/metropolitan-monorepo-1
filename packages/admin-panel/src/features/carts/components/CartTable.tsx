import {
  Avatar,
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
} from "@heroui/react";
import { Clock } from "lucide-react";
import type { AdminCartItem } from "../../../api/carts";

interface CartTableProps {
  carts: AdminCartItem[];
  loading: boolean;
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

const getLastActivityChip = (days: number) => {
  const color = days >= 7 ? "danger" : days >= 3 ? "warning" : "success";
  const label = days === 0 ? "Bugün" : days === 1 ? "1 gün önce" : `${days} gün önce`;

  return (
    <Chip
      color={color}
      size="sm"
      variant="flat"
      startContent={<Clock className="h-3 w-3" />}
    >
      {label}
    </Chip>
  );
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

export const CartTable = ({ carts, loading }: CartTableProps) => {
  return (
    <Card className="dark:bg-[#1a1a1a] dark:border dark:border-[#2a2a2a]">
      <CardBody>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" color="primary" />
          </div>
        ) : (
          <Table aria-label="Sepetler tablosu">
            <TableHeader>
              <TableColumn>KULLANICI</TableColumn>
              <TableColumn>TİP</TableColumn>
              <TableColumn>ÜRÜN</TableColumn>
              <TableColumn>MİKTAR</TableColumn>
              <TableColumn>BİRİM FİYAT</TableColumn>
              <TableColumn>TOPLAM</TableColumn>
              <TableColumn>SON AKTİVİTE</TableColumn>
              <TableColumn>OLUŞTURMA</TableColumn>
            </TableHeader>
            <TableBody emptyContent="Sepet bulunamadı">
              {carts.map((cart) => (
                <TableRow key={cart.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium">
                        {cart.userName || "Anonim"}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {cart.userEmail || cart.userPhone}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{getUserTypeChip(cart.userType)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {cart.productImage && (
                        <Avatar
                          src={cart.productImage}
                          alt={cart.productName || cart.productCode}
                          className="h-10 w-10 flex-shrink-0"
                          radius="sm"
                        />
                      )}
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {cart.productName || cart.productCode}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {cart.productCode}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip size="sm" variant="flat">
                      {cart.quantity} adet
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">
                      {formatPrice(Number(cart.price || 0))} zł
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {formatPrice(cart.totalPrice)} zł
                    </span>
                  </TableCell>
                  <TableCell>{getLastActivityChip(cart.lastActivityDays)}</TableCell>
                  <TableCell>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(cart.createdAt)}
                    </span>
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
