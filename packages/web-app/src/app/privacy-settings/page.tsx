"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useCurrentUser } from "@/hooks/api/use-user";
import { useAuthStore } from "@/stores";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function PrivacySettingsPage() {
  const router = useRouter();
  const { user, accessToken, _hasHydrated } = useAuthStore();
  const { data: currentUser } = useCurrentUser();

  const [privacySettings, setPrivacySettings] = useState({
    shareDataWithPartners: currentUser?.shareDataWithPartners || false,
    analyticsData: currentUser?.analyticsData || false,
    marketingEmails: currentUser?.marketingConsent || false,
  });

  const [isSaving, setIsSaving] = useState(false);

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
            icon="solar:eye-line-duotone"
            className="size-16 text-muted-foreground mx-auto mb-4"
          />
          <h2 className="text-2xl font-bold mb-2">Giriş Yapın</h2>
          <p className="text-muted-foreground mb-6">
            Gizlilik ayarlarınızı görmek için giriş yapmalısınız.
          </p>
          <Button asChild>
            <Link href="/auth/phone-login">Giriş Yap</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleToggle = (key: keyof typeof privacySettings) => {
    setPrivacySettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);

    // TODO: API call to save privacy settings
    setTimeout(() => {
      toast.success("Gizlilik ayarları güncellendi");
      setIsSaving(false);
    }, 1000);
  };

  const isChanged =
    privacySettings.shareDataWithPartners !== (currentUser?.shareDataWithPartners || false) ||
    privacySettings.analyticsData !== (currentUser?.analyticsData || false) ||
    privacySettings.marketingEmails !== (currentUser?.marketingConsent || false);

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
            <h1 className="text-2xl font-bold">Gizlilik Ayarları</h1>
            <p className="text-sm text-muted-foreground">
              Verilerinizin nasıl kullanıldığını kontrol edin
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Data Sharing */}
          <div className="bg-card rounded-xl border border-border">
            <div className="p-4">
              <div className="mb-4">
                <h2 className="text-base font-semibold">Veri Paylaşımı</h2>
                <p className="text-xs text-muted-foreground">
                  Verilerinizin üçüncü taraflarla paylaşım tercihleri
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <Label htmlFor="shareData" className="font-medium">
                      Partnerlerle Veri Paylaşımı
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Güvenilir iş ortaklarımızla kişiselleştirilmiş hizmetler
                      için verilerinizi paylaşın
                    </p>
                  </div>
                  <Switch
                    id="shareData"
                    checked={privacySettings.shareDataWithPartners}
                    onCheckedChange={() =>
                      handleToggle("shareDataWithPartners")
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <Label htmlFor="analytics" className="font-medium">
                      Analitik Verileri
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Hizmetlerimizi geliştirmek için anonim kullanım
                      verilerini toplamamıza izin verin
                    </p>
                  </div>
                  <Switch
                    id="analytics"
                    checked={privacySettings.analyticsData}
                    onCheckedChange={() => handleToggle("analyticsData")}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Marketing Preferences */}
          <div className="bg-card rounded-xl border border-border">
            <div className="p-4">
              <div className="mb-4">
                <h2 className="text-base font-semibold">Pazarlama Tercihleri</h2>
                <p className="text-xs text-muted-foreground">
                  Kampanya ve duyurular için iletişim tercihleri
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <Label htmlFor="marketing" className="font-medium">
                      Pazarlama E-postaları
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Özel teklifler, kampanyalar ve yeni ürünler hakkında
                      bildirim alın
                    </p>
                  </div>
                  <Switch
                    id="marketing"
                    checked={privacySettings.marketingEmails}
                    onCheckedChange={() => handleToggle("marketingEmails")}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Data Rights */}
          <div className="bg-card rounded-xl border border-border">
            <div className="p-4">
              <div className="mb-4">
                <h2 className="text-base font-semibold">Veri Haklarınız</h2>
                <p className="text-xs text-muted-foreground">
                  KVKK ve GDPR kapsamında haklarınız
                </p>
              </div>

              <div className="space-y-3">
                <Link
                  href="/account-settings"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                    <Icon
                      icon="solar:download-line-duotone"
                      className="size-5 text-blue-600 dark:text-blue-400"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">Verilerimi İndir</h3>
                    <p className="text-xs text-muted-foreground">
                      Tüm kişisel verilerinizi indirin
                    </p>
                  </div>
                  <Icon
                    icon="solar:alt-arrow-right-line-duotone"
                    className="size-5 text-muted-foreground group-hover:translate-x-1 transition-transform"
                  />
                </Link>

                <Separator />

                <Link
                  href="/account-settings"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                    <Icon
                      icon="solar:trash-bin-trash-line-duotone"
                      className="size-5 text-red-600 dark:text-red-400"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm text-red-600 dark:text-red-400">
                      Hesabı Sil
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Hesabınızı ve tüm verilerinizi kalıcı olarak silin
                    </p>
                  </div>
                  <Icon
                    icon="solar:alt-arrow-right-line-duotone"
                    className="size-5 text-red-600 dark:text-red-400 group-hover:translate-x-1 transition-transform"
                  />
                </Link>
              </div>
            </div>
          </div>

          {/* Save Button */}
          {isChanged && (
            <div className="sticky bottom-6 bg-background/80 backdrop-blur-sm p-4 rounded-xl border border-border shadow-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Yaptığınız değişiklikleri kaydetmeyi unutmayın
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPrivacySettings({
                        shareDataWithPartners: currentUser?.shareDataWithPartners || false,
                        analyticsData: currentUser?.analyticsData || false,
                        marketingEmails: currentUser?.marketingConsent || false,
                      });
                    }}
                  >
                    İptal
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Icon
                          icon="svg-spinners:ring-resize"
                          className="size-4 mr-2"
                        />
                        Kaydediliyor
                      </>
                    ) : (
                      <>
                        <Icon
                          icon="solar:check-circle-line-duotone"
                          className="size-4 mr-2"
                        />
                        Kaydet
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}