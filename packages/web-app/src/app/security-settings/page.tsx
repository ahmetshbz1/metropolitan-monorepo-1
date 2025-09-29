"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useCurrentUser } from "@/hooks/api/use-user";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface SecuritySettings {
  twoFactorEnabled: boolean;
  loginAlerts: boolean;
  deviceTracking: boolean;
}

export default function SecuritySettingsPage() {
  const router = useRouter();
  const { user, accessToken, _hasHydrated } = useAuthStore();
  const { data: currentUser, refetch: refetchUser } = useCurrentUser();

  const [settings, setSettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    loginAlerts: true,
    deviceTracking: true,
  });
  const [loading, setLoading] = useState(false);
  const [unlinkDialogOpen, setUnlinkDialogOpen] = useState(false);
  const [providerToUnlink, setProviderToUnlink] = useState<'apple' | 'google' | null>(null);

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

  const updateSetting = async (key: keyof SecuritySettings, value: boolean) => {
    // İki faktörlü doğrulama henüz hazır değil
    if (key === "twoFactorEnabled") {
      toast.info("Bu özellik yakında eklenecek");
      return;
    }

    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    setLoading(true);
    try {
      await api.put("/users/user/security-settings", newSettings);
      toast.success("Güvenlik ayarları güncellendi");
    } catch (error: any) {
      setSettings(settings); // Revert on error
      toast.error(error.response?.data?.message || "Güvenlik ayarları güncellenemedi");
    } finally {
      setLoading(false);
    }
  };

  const handleLinkProvider = async (provider: 'apple' | 'google') => {
    toast.info(`${provider === 'apple' ? 'Apple' : 'Google'} hesabı bağlama özelliği yakında eklenecek`);
  };

  const handleUnlinkProvider = (provider: 'apple' | 'google') => {
    setProviderToUnlink(provider);
    setUnlinkDialogOpen(true);
  };

  const confirmUnlinkProvider = async () => {
    if (!providerToUnlink) return;

    setLoading(true);
    try {
      await api.delete("/me/social-provider");
      toast.success(`${providerToUnlink === 'apple' ? 'Apple' : 'Google'} hesabı bağlantısı kesildi`);
      await refetchUser();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Bağlantı kesilemedi");
    } finally {
      setLoading(false);
      setUnlinkDialogOpen(false);
      setProviderToUnlink(null);
    }
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
          {/* Linked Accounts */}
          <div className="bg-card rounded-xl border border-border">
            <div className="p-4">
              <div className="mb-4">
                <h2 className="text-base font-semibold">Bağlı Hesaplar</h2>
                <p className="text-xs text-muted-foreground">
                  Sosyal medya hesaplarınızla hızlı giriş yapın
                </p>
              </div>

              <div className="space-y-2">
                {/* Google */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                    <Icon
                      icon="logos:google-icon"
                      className="size-5"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Google</p>
                    <p className="text-xs text-muted-foreground">
                      {currentUser?.authProvider === "google" && currentUser?.email
                        ? currentUser.email
                        : "Bağlı değil"}
                    </p>
                  </div>
                  {currentUser?.authProvider === "google" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnlinkProvider('google')}
                      disabled={loading}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10 text-xs h-7 px-2"
                    >
                      Bağlantıyı Kes
                    </Button>
                  ) : !currentUser?.authProvider ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLinkProvider('google')}
                      disabled={loading}
                      className="text-primary hover:bg-primary/10 text-xs h-7 px-2"
                    >
                      Bağla
                    </Button>
                  ) : null}
                </div>

                <Separator className="my-1" />

                {/* Apple */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Icon
                      icon="simple-icons:apple"
                      className="size-5"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Apple</p>
                    <p className="text-xs text-muted-foreground">
                      {currentUser?.authProvider === "apple"
                        ? currentUser?.email || "Bağlı"
                        : "Bağlı değil"}
                    </p>
                  </div>
                  {currentUser?.authProvider === "apple" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnlinkProvider('apple')}
                      disabled={loading}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10 text-xs h-7 px-2"
                    >
                      Bağlantıyı Kes
                    </Button>
                  ) : !currentUser?.authProvider ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLinkProvider('apple')}
                      disabled={loading}
                      className="text-primary hover:bg-primary/10 text-xs h-7 px-2"
                    >
                      Bağla
                    </Button>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      Bağlı değil
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Phone Number */}
          <div className="bg-card rounded-xl border border-border">
            <div className="p-4">
              <div className="mb-4">
                <h2 className="text-base font-semibold">Telefon Numarası</h2>
                <p className="text-xs text-muted-foreground">
                  Hesabınıza kayıtlı telefon numarası (OTP ile giriş)
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Icon
                      icon="solar:phone-calling-line-duotone"
                      className="size-5 text-primary"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Telefon Numarası</p>
                    <p className="text-xs text-muted-foreground">
                      {user.phone || "Kayıtlı değil"}
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    Bağlı
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Telefon numaranızı değiştirmek için destek ile iletişime geçin
                </p>
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

          {/* Security Settings */}
          <div className="bg-card rounded-xl border border-border">
            <div className="p-4">
              <div className="mb-4">
                <h2 className="text-base font-semibold">Hesap Güvenliği</h2>
                <p className="text-xs text-muted-foreground">
                  Güvenlik ayarlarınızı yönetin
                </p>
              </div>

              <div className="space-y-4">
                {/* Two-Factor Authentication */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="twoFactor" className="font-medium">
                        İki Faktörlü Doğrulama
                      </Label>
                      <Badge variant="secondary" className="text-xs">
                        Yakında
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Hesabınız için ekstra güvenlik katmanı
                    </p>
                  </div>
                  <Switch
                    id="twoFactor"
                    checked={settings.twoFactorEnabled}
                    onCheckedChange={(checked) =>
                      updateSetting("twoFactorEnabled", checked)
                    }
                    disabled={loading}
                  />
                </div>

                <Separator />

                {/* Login Alerts */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <Label htmlFor="loginAlerts" className="font-medium">
                      Giriş Bildirimleri
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Yeni cihaz girişlerinde bildirim al
                    </p>
                  </div>
                  <Switch
                    id="loginAlerts"
                    checked={settings.loginAlerts}
                    onCheckedChange={(checked) =>
                      updateSetting("loginAlerts", checked)
                    }
                    disabled={loading}
                  />
                </div>

                <Separator />

                {/* Device Tracking */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <Label htmlFor="deviceTracking" className="font-medium">
                      Cihaz Takibi
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Hesabınıza bağlı cihazları izleyin
                    </p>
                  </div>
                  <Switch
                    id="deviceTracking"
                    checked={settings.deviceTracking}
                    onCheckedChange={(checked) =>
                      updateSetting("deviceTracking", checked)
                    }
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Unlink Provider Confirmation Dialog */}
      <AlertDialog open={unlinkDialogOpen} onOpenChange={setUnlinkDialogOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 rounded-full bg-red-100 dark:bg-red-900/20">
              <Icon
                icon="solar:danger-circle-bold-duotone"
                className="size-6 text-red-600 dark:text-red-400"
              />
            </div>
            <AlertDialogTitle className="text-center">
              Bağlantıyı Kes
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              <span className="font-semibold text-foreground">
                {providerToUnlink === 'apple' ? 'Apple' : 'Google'}
              </span>{' '}
              hesabınızın bağlantısını kesmek istediğinize emin misiniz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-2">
            <AlertDialogCancel disabled={loading} className="sm:w-24">
              İptal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmUnlinkProvider}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600 sm:w-32"
            >
              {loading ? (
                <>
                  <Icon
                    icon="svg-spinners:ring-resize"
                    className="size-4 mr-2"
                  />
                  Kesiliyor
                </>
              ) : (
                "Bağlantıyı Kes"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}