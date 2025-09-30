"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCompleteProfile } from "@/hooks/api";
import { useAuthStore } from "@/stores";
import { ArrowLeft, Loader2, User } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function CompleteProfilePage() {
  const { t } = useTranslation();
  const completeProfile = useCompleteProfile();
  const socialAuthData = useAuthStore((state) => (state as any).socialAuthData);
  const router = useRouter();
  const searchParams = useSearchParams();

  const userType =
    (searchParams.get("userType") as "individual" | "corporate") ||
    "individual";
  const returnToCart = searchParams.get("returnToCart") === "true";

  const [formData, setFormData] = useState({
    firstName: socialAuthData?.firstName || "",
    lastName: socialAuthData?.lastName || "",
    email: socialAuthData?.email || "",
    companyName: "",
    nip: "",
    userType: userType,
    termsAccepted: false,
    privacyAccepted: false,
    marketingAccepted: false,
  });
  const [error, setError] = useState("");

  const isFormValid = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) return false;
    if (!formData.email.trim()) return false;
    if (formData.userType === "corporate" && formData.nip.trim().length !== 10)
      return false;
    if (!formData.termsAccepted || !formData.privacyAccepted) return false;
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid()) {
      setError("Lütfen tüm gerekli alanları doldurunuz");
      return;
    }

    setError("");

    completeProfile.mutate(
      {
        userType: formData.userType,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        ...(formData.nip ? { nip: formData.nip } : {}),
        termsAccepted: formData.termsAccepted,
        privacyAccepted: formData.privacyAccepted,
        marketingConsent: formData.marketingAccepted, // Backend expects 'marketingConsent' not 'marketingAccepted'
        ...(socialAuthData?.uid ? { firebaseUid: socialAuthData.uid } : {}),
        ...(socialAuthData?.provider
          ? { authProvider: socialAuthData.provider }
          : {}),
      },
      {
        onSuccess: (result) => {
          if (result.success) {
            if (returnToCart) {
              router.push("/?openCart=true");
            } else {
              router.push("/");
            }
          } else {
            setError(result.message);
          }
        },
        onError: (error: any) => {
          setError(error.message || "Profil tamamlanırken bir hata oluştu");
        },
      }
    );
  };

  const handleInputChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md mx-auto flex flex-col justify-center">
        <Card className="border shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-start">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/auth/verify-otp">
                      <ArrowLeft className="h-4 w-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Geri Dön</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">
                Profilinizi Tamamlayın
              </CardTitle>
              <CardDescription className="text-base">
                Size daha iyi hizmet verebilmek için bilgilerinizi tamamlayın
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium">
                    Ad *
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleInputChange("firstName")}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium">
                    Soyad *
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleInputChange("lastName")}
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  E-posta *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange("email")}
                  required
                />
              </div>

              {/* Corporate Fields */}
              {formData.userType === "corporate" && (
                <div className="space-y-2">
                  <Label htmlFor="nip" className="text-sm font-medium">
                    Vergi Numarası (NIP) *
                  </Label>
                  <Input
                    id="nip"
                    type="text"
                    value={formData.nip}
                    onChange={handleInputChange("nip")}
                    placeholder="1234567890"
                    maxLength={10}
                  />
                </div>
              )}

              {/* Terms Section - Mobile-app style */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">
                  Sözleşmeler ve İzinler
                </Label>

                {/* Terms of Service */}
                <div className="flex items-start space-x-3 p-3 rounded-lg border">
                  <Checkbox
                    id="termsAccepted"
                    checked={formData.termsAccepted}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        termsAccepted: checked as boolean,
                      }))
                    }
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="termsAccepted"
                      className="text-sm cursor-pointer"
                    >
                      <span className="text-muted-foreground">
                        Kabul ediyorum:{" "}
                      </span>
                      <Link
                        href={`https://metropolitanfg.pl/terms-of-service?lang=${t("common.lang_code") || "tr"}`}
                        target="_blank"
                        className="text-primary font-medium hover:underline"
                      >
                        Kullanım Koşulları
                      </Link>
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                  </div>
                </div>

                {/* Privacy Policy */}
                <div className="flex items-start space-x-3 p-3 rounded-lg border">
                  <Checkbox
                    id="privacyAccepted"
                    checked={formData.privacyAccepted}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        privacyAccepted: checked as boolean,
                      }))
                    }
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="privacyAccepted"
                      className="text-sm cursor-pointer"
                    >
                      <span className="text-muted-foreground">
                        Kabul ediyorum:{" "}
                      </span>
                      <Link
                        href={`https://metropolitanfg.pl/privacy-policy?lang=${t("common.lang_code") || "tr"}`}
                        target="_blank"
                        className="text-primary font-medium hover:underline"
                      >
                        Gizlilik Politikası
                      </Link>
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                  </div>
                </div>

                {/* Marketing Communications */}
                <div className="flex items-start space-x-3 p-3 rounded-lg border border-dashed">
                  <Checkbox
                    id="marketingAccepted"
                    checked={formData.marketingAccepted}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        marketingAccepted: checked as boolean,
                      }))
                    }
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="marketingAccepted"
                      className="text-sm cursor-pointer"
                    >
                      Pazarlama iletişimlerini kabul ediyorum
                    </Label>
                    <div className="text-xs text-muted-foreground mt-1">
                      Kampanya, indirim ve yeni ürün duyurularını e-posta ile
                      almak istiyorum. (İsteğe bağlı)
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
                disabled={!isFormValid() || completeProfile.isPending}
                className="w-full h-12 font-medium"
              >
                {completeProfile.isPending ? (
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
