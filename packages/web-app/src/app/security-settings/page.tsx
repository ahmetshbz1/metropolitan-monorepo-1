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
import { useCurrentUser, userKeys } from "@/hooks/api/use-user";
import { auth } from "@/lib/firebase";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { Icon } from "@iconify/react";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface SecuritySettings {
  twoFactorEnabled: boolean;
  loginAlerts: boolean;
  deviceTracking: boolean;
}

export default function SecuritySettingsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, accessToken, _hasHydrated, setUser } = useAuthStore();
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
          <h2 className="text-2xl font-bold mb-2">{t("security_settings.login_required_title")}</h2>
          <p className="text-muted-foreground mb-6">
            {t("security_settings.login_required_desc")}
          </p>
          <Button asChild>
            <Link href="/auth/phone-login">{t("security_settings.login_button")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const updateSetting = async (key: keyof SecuritySettings, value: boolean) => {
    // İki faktörlü doğrulama henüz hazır değil
    if (key === "twoFactorEnabled") {
      toast.info(t("toast.feature_coming_soon"));
      return;
    }

    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    setLoading(true);
    try {
      await api.put("/users/user/security-settings", newSettings);
      toast.success(t("toast.security_settings_updated"));
    } catch (error: any) {
      setSettings(settings); // Revert on error
      toast.error(error.response?.data?.message || t("toast.security_settings_update_failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleLinkProvider = async (provider: 'apple' | 'google') => {
    if (provider === 'apple') {
      // Apple Sign In sadece mobile'da çalışır
      toast.info(t("security_settings.linked_accounts.apple_mobile_only"), {
        duration: 5000,
      });
      return;
    }

    // Google Sign In
    setLoading(true);
    try {
      const googleProvider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, googleProvider);

      if (!result.user) {
        throw new Error(t("security_settings.linked_accounts.google_signin_failed"));
      }

      // Backend'e link isteği gönder
      await api.post("/users/me/link-provider", {
        provider: 'google',
        firebaseUid: result.user.uid,
        email: result.user.email,
      });

      // Kullanıcı datasını güncelle
      await queryClient.invalidateQueries({ queryKey: userKeys.current() });

      const updatedUser = await queryClient.fetchQuery({
        queryKey: userKeys.current(),
        queryFn: async () => {
          const { authApi } = await import("@/services/api/auth-api");
          return authApi.getCurrentUser();
        },
      });

      if (updatedUser) {
        setUser(updatedUser);
      }

      toast.success(t("security_settings.linked_accounts.google_connected"));
    } catch (error: any) {
      console.error('Link provider error:', error);

      if (error?.response?.data?.error === 'PROVIDER_CONFLICT') {
        toast.error(error.response.data.message);
      } else if (error?.response?.data?.error === 'ALREADY_LINKED') {
        toast.error(error.response.data.message);
      } else {
        toast.error(t("security_settings.linked_accounts.google_connect_failed"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkProvider = (provider: 'apple' | 'google') => {
    setProviderToUnlink(provider);
    setUnlinkDialogOpen(true);
  };

  const confirmUnlinkProvider = async () => {
    if (!providerToUnlink) return;

    setLoading(true);
    try {
      await api.delete("/users/me/social-provider");

      // Invalidate and refetch user data
      await queryClient.invalidateQueries({ queryKey: userKeys.current() });

      // Force refetch to get updated user
      const updatedUser = await queryClient.fetchQuery({
        queryKey: userKeys.current(),
        queryFn: async () => {
          const { authApi } = await import("@/services/api/auth-api");
          return authApi.getCurrentUser();
        },
      });

      if (updatedUser) {
        setUser(updatedUser);
      }

      toast.success(t("security_settings.linked_accounts.disconnected", { provider: providerToUnlink === 'apple' ? 'Apple' : 'Google' }));
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("toast.disconnect_failed"));
    } finally {
      setLoading(false);
      setUnlinkDialogOpen(false);
      setProviderToUnlink(null);
    }
  };

  return (
    <div className="min-h-screen bg-background py-6">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Header - Compact */}
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full h-8 w-8"
          >
            <Icon icon="solar:arrow-left-line-duotone" className="size-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">{t("security_settings.title")}</h1>
            <p className="text-xs text-muted-foreground">
              {t("security_settings.subtitle")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Linked Accounts - Compact */}
          <div className="bg-card rounded-lg border">
            <div className="p-4">
              <div className="mb-3">
                <h2 className="text-sm font-semibold">{t("security_settings.linked_accounts.title")}</h2>
                <p className="text-xs text-muted-foreground">
                  {t("security_settings.linked_accounts.subtitle")}
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
                    <p className="font-medium text-sm">{t("security_settings.linked_accounts.google")}</p>
                    <p className="text-xs text-muted-foreground">
                      {currentUser?.authProvider === "google" && currentUser?.email
                        ? currentUser.email
                        : t("connection_status.not_connected")}
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
                      {t("security_settings.linked_accounts.disconnect")}
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLinkProvider('google')}
                      disabled={loading}
                      className="text-primary hover:bg-primary/10 text-xs h-7 px-2"
                    >
                      {t("security_settings.linked_accounts.connect")}
                    </Button>
                  )}
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
                    <p className="font-medium text-sm">{t("security_settings.linked_accounts.apple")}</p>
                    <p className="text-xs text-muted-foreground">
                      {currentUser?.authProvider === "apple"
                        ? currentUser?.email || t("connection_status.connected")
                        : t("connection_status.not_connected")}
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
                      {t("security_settings.linked_accounts.disconnect")}
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLinkProvider('apple')}
                      disabled={loading}
                      className="text-primary hover:bg-primary/10 text-xs h-7 px-2"
                    >
                      {t("security_settings.linked_accounts.connect")}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Phone Number - Compact */}
          <div className="bg-card rounded-lg border">
            <div className="p-4">
              <div className="mb-3">
                <h2 className="text-sm font-semibold">{t("security_settings.phone_number.title")}</h2>
                <p className="text-xs text-muted-foreground">
                  {t("security_settings.phone_number.subtitle")}
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
                    <p className="font-medium text-sm">{t("security_settings.phone_number.label")}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.phone || t("connection_status.not_registered")}
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    {t("security_settings.phone_number.connected")}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("security_settings.phone_number.change_help")}
                </p>
              </div>
            </div>
          </div>

          {/* Active Sessions - Compact */}
          <div className="bg-card rounded-lg border">
            <div className="p-4">
              <div className="mb-3">
                <h2 className="text-sm font-semibold">Aktif Oturumlar</h2>
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

          {/* Security Settings - Compact - Full Width */}
          <div className="bg-card rounded-lg border md:col-span-2">
            <div className="p-4">
              <div className="mb-3">
                <h2 className="text-sm font-semibold">Hesap Güvenliği</h2>
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