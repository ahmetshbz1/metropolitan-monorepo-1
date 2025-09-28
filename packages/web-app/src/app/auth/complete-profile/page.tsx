"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, CheckCircle2, Circle, Loader2, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function CompleteProfilePage() {
  const { t } = useTranslation();
  const { completeProfile, socialAuthData } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    firstName: socialAuthData?.firstName || "",
    lastName: socialAuthData?.lastName || "",
    email: socialAuthData?.email || "",
    companyName: "",
    nip: "",
    userType: "individual" as "individual" | "corporate",
    termsAccepted: false,
    privacyAccepted: false,
    marketingAccepted: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isFormValid = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) return false;
    if (!formData.email.trim()) return false;
    if (formData.userType === "corporate" && !formData.companyName.trim()) return false;
    if (!formData.termsAccepted || !formData.privacyAccepted) return false;
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid()) {
      setError("Lütfen tüm gerekli alanları doldurunuz");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await completeProfile({
        ...formData,
        termsAccepted: formData.termsAccepted && formData.privacyAccepted
      });
      if (result.success) {
        router.push("/");
      } else {
        setError(result.message);
      }
    } catch (error: any) {
      setError(error.message || "Profil tamamlanırken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/auth/verify-otp">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Geri Dön
            </Link>
          </Button>
        </div>

        <Card className="border shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Profilinizi Tamamlayın</CardTitle>
              <CardDescription className="text-base">
                Size daha iyi hizmet verebilmek için bilgilerinizi tamamlayın
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* User Type Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Hesap Türü</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={formData.userType === "individual" ? "default" : "outline"}
                    onClick={() => setFormData(prev => ({ ...prev, userType: "individual" }))}
                    className="h-11"
                  >
                    Bireysel
                  </Button>
                  <Button
                    type="button"
                    variant={formData.userType === "corporate" ? "default" : "outline"}
                    onClick={() => setFormData(prev => ({ ...prev, userType: "corporate" }))}
                    className="h-11"
                  >
                    Kurumsal
                  </Button>
                </div>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium">Ad *</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleInputChange("firstName")}
                    className="h-11 bg-muted/50 border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium">Soyad *</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleInputChange("lastName")}
                    className="h-11 bg-muted/50 border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">E-posta *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange("email")}
                  className="h-11 bg-muted/50 border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                />
              </div>

              {/* Corporate Fields */}
              {formData.userType === "corporate" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="text-sm font-medium">Şirket Adı *</Label>
                    <Input
                      id="companyName"
                      type="text"
                      value={formData.companyName}
                      onChange={handleInputChange("companyName")}
                      className="h-11 bg-muted/50 border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nip" className="text-sm font-medium">Vergi Numarası</Label>
                    <Input
                      id="nip"
                      type="text"
                      value={formData.nip}
                      onChange={handleInputChange("nip")}
                      className="h-11 bg-muted/50 border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      placeholder="1234567890"
                    />
                  </div>
                </>
              )}

              {/* Terms Section - Mobile-app style */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Sözleşmeler ve İzinler</Label>

                {/* Terms of Service */}
                <div className="flex items-start space-x-3 p-3 rounded-lg border">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, termsAccepted: !prev.termsAccepted }))}
                    className="mt-0.5"
                  >
                    {formData.termsAccepted ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                  <div className="flex-1 text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Kabul ediyorum: </span>
                    <Link
                      href={`https://metropolitanfg.pl/terms-of-service?lang=${t("common.lang_code") || "tr"}`}
                      target="_blank"
                      className="text-primary font-medium hover:underline"
                    >
                      Kullanım Koşulları
                    </Link>
                    <span className="text-red-500 ml-1">*</span>
                  </div>
                </div>

                {/* Privacy Policy */}
                <div className="flex items-start space-x-3 p-3 rounded-lg border">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, privacyAccepted: !prev.privacyAccepted }))}
                    className="mt-0.5"
                  >
                    {formData.privacyAccepted ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                  <div className="flex-1 text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Kabul ediyorum: </span>
                    <Link
                      href={`https://metropolitanfg.pl/privacy-policy?lang=${t("common.lang_code") || "tr"}`}
                      target="_blank"
                      className="text-primary font-medium hover:underline"
                    >
                      Gizlilik Politikası
                    </Link>
                    <span className="text-red-500 ml-1">*</span>
                  </div>
                </div>

                {/* Marketing Communications */}
                <div className="flex items-start space-x-3 p-3 rounded-lg border border-dashed">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, marketingAccepted: !prev.marketingAccepted }))}
                    className="mt-0.5"
                  >
                    {formData.marketingAccepted ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                  <div className="flex-1">
                    <div className="text-sm">
                      Pazarlama iletişimlerini kabul ediyorum
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Kampanya, indirim ve yeni ürün duyurularını e-posta ile almak istiyorum. (İsteğe bağlı)
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={!isFormValid() || loading}
                className="w-full h-12 font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Profil Tamamlanıyor...
                  </>
                ) : (
                  "Profilimi Tamamla"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}