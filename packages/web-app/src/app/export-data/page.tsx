"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function ExportDataPage() {
  const router = useRouter();
  const { user, accessToken, _hasHydrated } = useAuthStore();
  const [selectedMethod, setSelectedMethod] = useState<"email" | "download" | "">("");
  const [loading, setLoading] = useState(false);
  const [filePassword, setFilePassword] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

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
            icon="solar:download-square-line-duotone"
            className="size-16 text-muted-foreground mx-auto mb-4"
          />
          <h2 className="text-2xl font-bold mb-2">Giriş Yapın</h2>
          <p className="text-muted-foreground mb-6">
            Verilerinizi indirmek için giriş yapmalısınız.
          </p>
          <Button asChild>
            <Link href="/auth/phone-login">Giriş Yap</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleExport = async () => {
    if (!selectedMethod) {
      toast.error("Lütfen bir yöntem seçin");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/users/export-data", {
        method: selectedMethod,
      });

      if (response.data.success) {
        if (selectedMethod === "email") {
          toast.success("Verileriniz e-posta adresinize gönderildi");
          setSelectedMethod("");
        } else if (selectedMethod === "download") {
          setFilePassword(response.data.password);
          setDownloadUrl(response.data.downloadUrl);
          toast.success("Dosyanız hazır!");
        }
      } else {
        toast.error(response.data.message || "Veri dışa aktarılamadı");
      }
    } catch (error: any) {
      console.error("Export error:", error);
      toast.error(error.response?.data?.message || "Veri dışa aktarılamadı");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!downloadUrl) return;

    try {
      // Download file using API
      const response = await api.get(downloadUrl, {
        responseType: "blob",
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `verilerim_${new Date().getTime()}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Dosya indirildi");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Dosya indirilemedi");
    }
  };

  const copyPassword = () => {
    if (filePassword) {
      navigator.clipboard.writeText(filePassword);
      toast.success("Şifre kopyalandı");
    }
  };

  return (
    <div className="min-h-screen bg-background py-6">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/account-settings")}
            className="mb-2 -ml-2"
          >
            <Icon icon="solar:arrow-left-line-duotone" className="size-4 mr-2" />
            Hesap Ayarları
          </Button>
          <h1 className="text-2xl font-bold">Verilerimi İndir</h1>
          <p className="text-sm text-muted-foreground">
            Tüm kişisel verilerinizi indirin
          </p>
        </div>

        <div className="space-y-4">
          {/* Info Card */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Icon
                icon="solar:info-circle-bold-duotone"
                className="size-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
              />
              <div>
                <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-1">
                  Neler İçerilir?
                </h3>
                <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Profil bilgileriniz</li>
                  <li>• Sipariş geçmişiniz</li>
                  <li>• Kayıtlı adresleriniz</li>
                  <li>• Gizlilik tercihleriniz</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Export Method Selection */}
          <div className="bg-card rounded-xl border border-border">
            <div className="p-4">
              <div className="mb-4">
                <h2 className="text-base font-semibold">Dışa Aktarma Yöntemi</h2>
                <p className="text-xs text-muted-foreground">
                  Verilerinizi nasıl almak istersiniz?
                </p>
              </div>

              <RadioGroup value={selectedMethod} onValueChange={(value) => setSelectedMethod(value as "email" | "download")}>
                <div className="space-y-2">
                  <div className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="email" id="email" className="mt-0.5" />
                    <Label htmlFor="email" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon icon="solar:letter-bold-duotone" className="size-4 text-primary" />
                        <span className="font-medium text-sm">E-posta ile Gönder</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Verileriniz {user.email} adresinize gönderilecek
                      </p>
                    </Label>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="download" id="download" className="mt-0.5" />
                    <Label htmlFor="download" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon icon="solar:download-minimalistic-bold-duotone" className="size-4 text-green-600" />
                        <span className="font-medium text-sm">Doğrudan İndir</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        ZIP dosyası olarak şifrelenmiş şekilde indirilecek
                      </p>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Password Display */}
          {filePassword && downloadUrl && (
            <div className="bg-card rounded-xl border border-border">
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Icon icon="solar:lock-password-bold-duotone" className="size-5 text-yellow-600" />
                  <h3 className="font-semibold text-sm">Dosya Şifresi</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  ZIP dosyasını açmak için bu şifreye ihtiyacınız olacak
                </p>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted border border-border">
                  <code className="flex-1 text-sm font-mono">{filePassword}</code>
                  <Button size="sm" variant="ghost" onClick={copyPassword}>
                    <Icon icon="solar:copy-bold-duotone" className="size-4" />
                  </Button>
                </div>
                <Separator className="my-3" />
                <Button onClick={handleDownload} className="w-full" size="sm">
                  <Icon icon="solar:download-bold-duotone" className="size-4 mr-2" />
                  Dosyayı İndir
                </Button>
              </div>
            </div>
          )}

          {/* Action Button */}
          {!downloadUrl && (
            <Button
              onClick={handleExport}
              disabled={!selectedMethod || loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Icon icon="svg-spinners:ring-resize" className="size-4 mr-2" />
                  Hazırlanıyor...
                </>
              ) : (
                <>
                  <Icon icon="solar:export-bold-duotone" className="size-4 mr-2" />
                  Dışa Aktar
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}