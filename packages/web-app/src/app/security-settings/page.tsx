"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/stores";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function SecuritySettingsPage() {
  const router = useRouter();
  const { user, accessToken, _hasHydrated } = useAuthStore();
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Show loading state while hydrating
  if (!_hasHydrated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Icon icon="svg-spinners:ring-resize" className="size-12 text-primary" />
      </div>
    );
  }

  if (!accessToken || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Icon
            icon="solar:shield-warning-line-duotone"
            className="size-16 text-muted-foreground mx-auto mb-4"
          />
          <h2 className="text-2xl font-bold mb-2">Giriş Yapın</h2>
          <p className="text-muted-foreground mb-6">
            Güvenlik ayarlarınızı görmek için giriş yapmalısınız.
          </p>
          <Button asChild>
            <Link href="/auth/phone-login">Giriş Yap</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Yeni şifreler eşleşmiyor");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error("Şifre en az 8 karakter olmalıdır");
      return;
    }

    setIsChangingPassword(true);

    // TODO: API call to change password
    setTimeout(() => {
      toast.success("Şifre değiştirme özelliği yakında eklenecek");
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background py-6">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full"
          >
            <Icon icon="solar:arrow-left-line-duotone" className="size-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Güvenlik Ayarları</h1>
            <p className="text-sm text-muted-foreground">
              Hesap güvenliğinizi ve oturum yönetiminizi kontrol edin
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Password Change */}
          <div className="bg-card rounded-xl border border-border">
            <div className="p-4">
              <div className="mb-4">
                <h2 className="text-base font-semibold">Şifre Değiştir</h2>
                <p className="text-xs text-muted-foreground">
                  Güçlü bir şifre seçin ve kimseyle paylaşmayın
                </p>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Mevcut Şifre</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        currentPassword: e.target.value,
                      }))
                    }
                    placeholder="••••••••"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Yeni Şifre</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        newPassword: e.target.value,
                      }))
                    }
                    placeholder="••••••••"
                  />
                  <p className="text-xs text-muted-foreground">
                    En az 8 karakter, büyük ve küçük harf, rakam içermelidir
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Yeni Şifre (Tekrar)</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                    placeholder="••••••••"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={
                    isChangingPassword ||
                    !passwordData.currentPassword ||
                    !passwordData.newPassword ||
                    !passwordData.confirmPassword
                  }
                  className="w-full"
                >
                  {isChangingPassword ? (
                    <>
                      <Icon
                        icon="svg-spinners:ring-resize"
                        className="size-4 mr-2"
                      />
                      Değiştiriliyor
                    </>
                  ) : (
                    <>
                      <Icon
                        icon="solar:shield-check-line-duotone"
                        className="size-4 mr-2"
                      />
                      Şifreyi Değiştir
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>

          {/* Phone Number */}
          <div className="bg-card rounded-xl border border-border">
            <div className="p-4">
              <div className="mb-4">
                <h2 className="text-base font-semibold">Telefon Numarası</h2>
                <p className="text-xs text-muted-foreground">
                  Hesabınıza kayıtlı telefon numarası
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Telefon</Label>
                  <Input value={user.phone || ""} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">
                    Telefon numaranızı değiştirmek için destek ile iletişime geçin
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Active Sessions */}
          <div className="bg-card rounded-xl border border-border">
            <div className="p-4">
              <div className="mb-4">
                <h2 className="text-base font-semibold">Aktif Oturumlar</h2>
                <p className="text-xs text-muted-foreground">
                  Hesabınızda oturum açık olan cihazlar
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Icon
                      icon="solar:display-line-duotone"
                      className="size-5 text-primary"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Mevcut Cihaz (Web)</p>
                    <p className="text-xs text-muted-foreground">
                      Son aktivite: Şimdi
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    Aktif
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground text-center py-2">
                  Diğer oturumları görmek için yakında eklenecek
                </p>
              </div>
            </div>
          </div>

          {/* Two-Factor Authentication */}
          <div className="bg-card rounded-xl border border-border">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold">İki Faktörlü Doğrulama</h2>
                  <p className="text-xs text-muted-foreground">
                    Hesabınız için ekstra güvenlik katmanı
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  Yakında
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground">
                İki faktörlü doğrulama özelliği yakında eklenecek. Bu özellik
                aktif olduğunda, giriş yaparken telefon numaranıza gönderilen
                kod ile hesabınızı doğrulamanız gerekecek.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({ children, className, variant = "default" }: any) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        variant === "outline"
          ? "border border-border bg-background"
          : ""
      } ${className}`}
    >
      {children}
    </span>
  );
}