"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OTPInput } from "@/components/ui/otp-input";
import { api } from "@/lib/api";
import { tokenStorage } from "@/lib/token-storage";
import { useAuthStore } from "@/stores";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function DeleteAccountPage() {
  const router = useRouter();
  const { user, accessToken, _hasHydrated, clearAuth } = useAuthStore();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [otpError, setOtpError] = useState(false);

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
            icon="solar:user-cross-line-duotone"
            className="size-16 text-muted-foreground mx-auto mb-4"
          />
          <h2 className="text-2xl font-bold mb-2">Giriş Yapın</h2>
          <p className="text-muted-foreground mb-6">
            Hesabınızı silmek için giriş yapmalısınız.
          </p>
          <Button asChild>
            <Link href="/auth/phone-login">Giriş Yap</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Auto-fill user's phone number
  useEffect(() => {
    if (user?.phone) {
      setPhoneNumber(user.phone);
    }
  }, [user?.phone]);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleSendOTP = async () => {
    if (!phoneNumber.trim()) {
      toast.error("Telefon numarası gerekli");
      return;
    }

    // Phone number validation
    if (user?.phone && phoneNumber.replace(/[\s\-\(\)]/g, "") !== user.phone.replace(/[\s\-\(\)]/g, "")) {
      toast.error("Telefon numarası hesabınızdaki ile eşleşmiyor");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/account/delete/send-otp", {
        phoneNumber,
      });

      if (response.data.success) {
        setStep("otp");
        setResendTimer(60);
        toast.success("Doğrulama kodu gönderildi");
      } else {
        toast.error(response.data.message || "Kod gönderilemedi");
      }
    } catch (error: any) {
      console.error("Send OTP error:", error);
      toast.error(error.response?.data?.message || "Kod gönderilemedi");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) {
      setOtpError(true);
      toast.error("Doğrulama kodu 6 haneli olmalıdır");
      return;
    }

    setLoading(true);
    setOtpError(false);
    try {
      const response = await api.post("/auth/account/delete/verify-otp", {
        phoneNumber,
        otpCode,
      });

      if (response.data.success) {
        toast.success("Hesabınız başarıyla silindi");

        // Clear auth tokens and state
        await tokenStorage.remove();
        clearAuth();

        // Redirect to login page after 2 seconds
        setTimeout(() => {
          router.push("/auth/phone-login");
        }, 2000);
      } else {
        setOtpError(true);
        toast.error(response.data.message || "Doğrulama başarısız");
      }
    } catch (error: any) {
      console.error("Verify OTP error:", error);
      setOtpError(true);
      toast.error(error.response?.data?.message || "Doğrulama başarısız");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;

    setLoading(true);
    try {
      const response = await api.post("/auth/account/delete/send-otp", {
        phoneNumber,
      });

      if (response.data.success) {
        setResendTimer(60);
        toast.success("Kod yeniden gönderildi");
      } else {
        toast.error(response.data.message || "Kod gönderilemedi");
      }
    } catch (error: any) {
      console.error("Resend OTP error:", error);
      toast.error(error.response?.data?.message || "Kod gönderilemedi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-6">
      <div className="container mx-auto px-4 max-w-md">
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
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">Hesabı Sil</h1>
          <p className="text-sm text-muted-foreground">
            Bu işlem geri alınamaz
          </p>
        </div>

        <div className="space-y-4">
          {/* Warning Card */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Icon
                icon="solar:danger-triangle-bold-duotone"
                className="size-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
              />
              <div>
                <h3 className="font-semibold text-sm text-red-900 dark:text-red-100 mb-2">
                  Dikkat!
                </h3>
                <p className="text-xs text-red-800 dark:text-red-200 leading-relaxed">
                  Hesabınızı silerseniz tüm verileriniz silinecektir. 20 gün içinde tekrar giriş yaparsanız hesabınız yeniden aktif olur.
                </p>
              </div>
            </div>
          </div>

          {/* Phone Verification */}
          {step === "phone" && (
            <div className="bg-card rounded-xl border border-border">
              <div className="p-4">
                <div className="mb-4">
                  <h2 className="text-base font-semibold">Telefon Doğrulaması</h2>
                  <p className="text-xs text-muted-foreground">
                    Hesabınızı silmek için telefon numaranızı doğrulayın
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="phone">Telefon Numarası</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+48 XXX XXX XXX"
                      className="mt-1.5"
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Kayıtlı telefon numaranızı girin
                    </p>
                  </div>

                  <Button
                    onClick={handleSendOTP}
                    disabled={!phoneNumber.trim() || loading}
                    className="w-full bg-red-600 hover:bg-red-700"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Icon icon="svg-spinners:ring-resize" className="size-4 mr-2" />
                        Gönderiliyor...
                      </>
                    ) : (
                      <>
                        <Icon icon="solar:letter-bold-duotone" className="size-4 mr-2" />
                        Doğrulama Kodu Gönder
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* OTP Verification */}
          {step === "otp" && (
            <div className="bg-card rounded-xl border border-border">
              <div className="p-4">
                <div className="mb-6">
                  <h2 className="text-base font-semibold text-center">Doğrulama Kodu</h2>
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    {phoneNumber} numarasına gönderilen kodu girin
                  </p>
                </div>

                <div className="space-y-4">
                  <OTPInput
                    value={otpCode}
                    onChange={(value) => {
                      setOtpCode(value);
                      setOtpError(false);
                    }}
                    isError={otpError}
                    disabled={loading}
                  />

                  <Button
                    onClick={handleVerifyOTP}
                    disabled={otpCode.length !== 6 || loading}
                    className="w-full bg-red-600 hover:bg-red-700"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Icon icon="svg-spinners:ring-resize" className="size-4 mr-2" />
                        Doğrulanıyor...
                      </>
                    ) : (
                      <>
                        <Icon icon="solar:trash-bin-trash-bold-duotone" className="size-4 mr-2" />
                        Hesabı Sil
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleResendOTP}
                    disabled={resendTimer > 0 || loading}
                    variant="ghost"
                    className="w-full"
                    size="sm"
                  >
                    {resendTimer > 0 ? (
                      `Yeniden gönder (${resendTimer}s)`
                    ) : (
                      <>
                        <Icon icon="solar:refresh-bold-duotone" className="size-4 mr-2" />
                        Kodu Yeniden Gönder
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Back Button */}
          <Button
            variant="outline"
            onClick={() => router.push("/account-settings")}
            className="w-full"
          >
            <Icon icon="solar:close-circle-line-duotone" className="size-4 mr-2" />
            İptal
          </Button>
        </div>
      </div>
    </div>
  );
}