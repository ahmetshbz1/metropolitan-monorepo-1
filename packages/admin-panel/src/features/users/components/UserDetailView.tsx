import { Chip, Divider } from "@heroui/react";
import type { User } from "../../../api/users";

interface UserDetailViewProps {
  user: User;
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatAuthProvider = (provider: string | null): string => {
  if (!provider) return "Telefon";
  switch (provider.toLowerCase()) {
    case "google":
      return "Google";
    case "apple":
      return "Apple";
    default:
      return provider;
  }
};

const getUserTypeLabel = (userType: string): string => {
  return userType === "corporate" ? "Kurumsal" : "Bireysel";
};

export const UserDetailView = ({ user }: UserDetailViewProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="mb-3 text-sm font-semibold">Kişisel Bilgiler</h4>
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-slate-500 dark:text-slate-400">Ad:</span>{" "}
            <span className="font-medium">{user.firstName || "-"}</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">Soyad:</span>{" "}
            <span className="font-medium">{user.lastName || "-"}</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">E-posta:</span>{" "}
            <span className="font-medium">{user.email || "-"}</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">Telefon:</span>{" "}
            <span className="font-medium">{user.phoneNumber}</span>
          </div>
          {user.previousPhoneNumber && (
            <div>
              <span className="text-slate-500 dark:text-slate-400">Önceki Telefon:</span>{" "}
              <span className="font-medium">{user.previousPhoneNumber}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400">Telefon Doğrulama:</span>
            <Chip
              color={user.phoneNumberVerified ? "success" : "warning"}
              size="sm"
              variant="flat"
            >
              {user.phoneNumberVerified ? "Doğrulandı" : "Bekliyor"}
            </Chip>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">Giriş Yöntemi:</span>{" "}
            <span className="font-medium">{formatAuthProvider(user.authProvider)}</span>
          </div>
          {user.firebaseUid && (
            <div>
              <span className="text-slate-500 dark:text-slate-400">Firebase UID:</span>{" "}
              <span className="font-mono text-xs">{user.firebaseUid}</span>
            </div>
          )}
          {user.appleUserId && (
            <div>
              <span className="text-slate-500 dark:text-slate-400">Apple User ID:</span>{" "}
              <span className="font-mono text-xs">{user.appleUserId}</span>
            </div>
          )}
        </div>
      </div>

      <Divider />

      <div>
        <h4 className="mb-3 text-sm font-semibold">Hesap Bilgileri</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400">Kullanıcı Tipi:</span>
            <Chip
              color={user.userType === "corporate" ? "secondary" : "primary"}
              size="sm"
              variant="flat"
            >
              {getUserTypeLabel(user.userType)}
            </Chip>
          </div>
          {user.userType === "corporate" && (
            <>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Şirket Adı:</span>{" "}
                <span className="font-medium">{user.companyName || "-"}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">NIP:</span>{" "}
                <span className="font-medium">{user.companyNip || "-"}</span>
              </div>
              {user.companyId && (
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Şirket ID:</span>{" "}
                  <span className="font-mono text-xs">{user.companyId}</span>
                </div>
              )}
            </>
          )}
          <div>
            <span className="text-slate-500 dark:text-slate-400">Kayıt Tarihi:</span>{" "}
            <span className="font-medium">{formatDate(user.createdAt)}</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">Güncellenme:</span>{" "}
            <span className="font-medium">{formatDate(user.updatedAt)}</span>
          </div>
          {user.deletedAt && (
            <div>
              <span className="text-slate-500 dark:text-slate-400">Silinme:</span>{" "}
              <span className="font-medium text-red-600">{formatDate(user.deletedAt)}</span>
            </div>
          )}
        </div>
      </div>

      <Divider />

      <div>
        <h4 className="mb-3 text-sm font-semibold">İzinler ve Tercihler</h4>
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-slate-500 dark:text-slate-400">Pazarlama İzni:</span>{" "}
            <Chip color={user.marketingConsent ? "success" : "default"} size="sm" variant="flat">
              {user.marketingConsent ? "Var" : "Yok"}
            </Chip>
          </div>
          {user.marketingConsentAt && (
            <div>
              <span className="text-slate-500 dark:text-slate-400">İzin Tarihi:</span>{" "}
              <span className="font-medium">{formatDate(user.marketingConsentAt)}</span>
            </div>
          )}
          <div>
            <span className="text-slate-500 dark:text-slate-400">Veri Paylaşımı:</span>{" "}
            <Chip
              color={user.shareDataWithPartners ? "success" : "default"}
              size="sm"
              variant="flat"
            >
              {user.shareDataWithPartners ? "Aktif" : "Pasif"}
            </Chip>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">Analitik:</span>{" "}
            <Chip color={user.analyticsData ? "success" : "default"} size="sm" variant="flat">
              {user.analyticsData ? "Aktif" : "Pasif"}
            </Chip>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">SMS:</span>{" "}
            <Chip color={user.smsNotifications ? "success" : "default"} size="sm" variant="flat">
              {user.smsNotifications ? "Aktif" : "Pasif"}
            </Chip>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">Push:</span>{" "}
            <Chip color={user.pushNotifications ? "success" : "default"} size="sm" variant="flat">
              {user.pushNotifications ? "Aktif" : "Pasif"}
            </Chip>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">E-posta:</span>{" "}
            <Chip
              color={user.emailNotifications ? "success" : "default"}
              size="sm"
              variant="flat"
            >
              {user.emailNotifications ? "Aktif" : "Pasif"}
            </Chip>
          </div>
          {user.termsAcceptedAt && (
            <div>
              <span className="text-slate-500 dark:text-slate-400">Şartlar Kabul:</span>{" "}
              <span className="font-medium">{formatDate(user.termsAcceptedAt)}</span>
            </div>
          )}
          {user.privacyAcceptedAt && (
            <div>
              <span className="text-slate-500 dark:text-slate-400">Gizlilik Kabul:</span>{" "}
              <span className="font-medium">{formatDate(user.privacyAcceptedAt)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
