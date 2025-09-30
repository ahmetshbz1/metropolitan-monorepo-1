"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OTPInput } from "@/components/ui/otp-input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSendOTP, useVerifyOTP } from "@/hooks/api";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const OTP_LENGTH = 6;
const RESEND_DELAY_SECONDS = 60;

export default function VerifyOtpPage() {
  const { t } = useTranslation();
  const verifyOTP = useVerifyOTP();
  const sendOTP = useSendOTP();
  const router = useRouter();
  const searchParams = useSearchParams();

  const phoneParam = searchParams.get("phone") || "";
  const userTypeParam = searchParams.get("userType");
  const returnToCart = searchParams.get("returnToCart") === "true";

  const phoneNumber = phoneParam;
  const userType = useMemo<"individual" | "corporate">(() => {
    return userTypeParam === "corporate" ? "corporate" : "individual";
  }, [userTypeParam]);

  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_DELAY_SECONDS);

  const verifyButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!phoneNumber) {
      router.replace("/auth/phone-login");
    }
  }, [phoneNumber, router]);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 0) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    if (phoneNumber) {
      setCooldown(RESEND_DELAY_SECONDS);
    }
  }, [phoneNumber]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (verifyOTP.isPending) {
      return;
    }

    if (!phoneNumber) {
      setError(
        t(
          "auth.verifyOtp.errors.phoneMissing",
          "Telefon numarası bulunamadı. Lütfen tekrar giriş yapın."
        )
      );
      return;
    }

    if (otpCode.length !== OTP_LENGTH) {
      setError(
        t(
          "auth.verifyOtp.errors.invalidLength",
          "Lütfen 6 haneli doğrulama kodunu giriniz."
        )
      );
      return;
    }

    setError(null);
    setInfo(null);

    verifyOTP.mutate(
      { phoneNumber, otpCode, userType },
      {
        onSuccess: (result) => {
          console.log("✅ Verify OTP Success:", result);

          if (result.success) {
            // Check if user has tokens (existing user) or registrationToken (new user)
            const hasAccessToken = result.accessToken && result.refreshToken;
            const hasRegistrationToken = result.registrationToken;

            console.log("Has Access Token:", hasAccessToken);
            console.log("Has Registration Token:", hasRegistrationToken);
            console.log("Is New User:", result.isNewUser);

            if (hasRegistrationToken || result.isNewUser) {
              console.log("🆕 New user - redirecting to complete-profile");
              const returnParam = returnToCart ? "&returnToCart=true" : "";
              router.replace(
                `/auth/complete-profile?userType=${userType}${returnParam}`
              );
            } else if (hasAccessToken) {
              console.log("✅ Existing user - redirecting to home");
              if (returnToCart) {
                router.replace("/?openCart=true");
              } else {
                router.replace("/");
              }
            } else {
              console.log("⚠️ Unexpected response structure:", result);
              setError("Beklenmeyen yanıt alındı. Lütfen tekrar deneyin.");
            }
          } else {
            setError(
              result.message ||
                t(
                  "auth.verifyOtp.errors.verifyFailed",
                  "Doğrulama kodu kontrol edilirken bir hata oluştu."
                )
            );
          }
        },
        onError: () => {
          setError(
            t(
              "auth.verifyOtp.errors.verifyFailed",
              "Doğrulama kodu kontrol edilirken bir hata oluştu."
            )
          );
        },
      }
    );
  };

  const handleResendCode = async () => {
    if (sendOTP.isPending || cooldown > 0 || !phoneNumber) {
      return;
    }

    setError(null);
    setInfo(null);
    setOtpCode("");

    sendOTP.mutate(
      { phoneNumber, userType },
      {
        onSuccess: (result) => {
          if (result.success) {
            setCooldown(RESEND_DELAY_SECONDS);
            setInfo(
              result.message ||
                t(
                  "auth.verifyOtp.info.resent",
                  "Yeni doğrulama kodu gönderildi."
                )
            );
          } else {
            setError(
              result.message ||
                t(
                  "auth.verifyOtp.errors.resendFailed",
                  "Kod tekrar gönderilirken bir hata oluştu."
                )
            );
          }
        },
        onError: () => {
          setError(
            t(
              "auth.verifyOtp.errors.resendFailed",
              "Kod tekrar gönderilirken bir hata oluştu."
            )
          );
        },
      }
    );
  };

  const handleOtpComplete = () => {
    verifyButtonRef.current?.focus();
  };

  const countdownLabel = useMemo(() => {
    if (cooldown <= 0) {
      return t("auth.verifyOtp.resendReady", "Tekrar kod gönderebilirsiniz.");
    }
    return t("auth.verifyOtp.resendIn", "Tekrar kod için {{second}} sn.", {
      second: cooldown,
    });
  }, [cooldown, t]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-4 text-center">
            <div className="flex justify-start">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/auth/phone-login">
                      <ArrowLeft className="h-4 w-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Geri Dön</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">
                {t("auth.verifyOtp.title", "Doğrulama Kodu")}
              </CardTitle>
              <CardDescription className="text-base">
                {t(
                  "auth.verifyOtp.subtitle",
                  "{{phone}} numarasına gönderilen 6 haneli kodu giriniz.",
                  { phone: phoneNumber }
                )}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit} noValidate>
              <div className="space-y-3">
                <OTPInput
                  value={otpCode}
                  onChange={(value) => {
                    setOtpCode(value);
                    setError(null);
                  }}
                  onComplete={handleOtpComplete}
                  isError={Boolean(error)}
                  disabled={verifyOTP.isPending}
                />
                <p className="text-center text-xs text-muted-foreground">
                  {t(
                    "auth.verifyOtp.helper",
                    "6 haneli doğrulama kodunu giriniz"
                  )}
                </p>
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {info && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                  {info}
                </div>
              )}

              <Button
                ref={verifyButtonRef}
                type="submit"
                className="h-11 w-full"
                disabled={
                  otpCode.length !== OTP_LENGTH ||
                  verifyOTP.isPending ||
                  !phoneNumber
                }
              >
                {verifyOTP.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("auth.verifyOtp.verifying", "Doğrulanıyor...")}
                  </>
                ) : (
                  t("auth.verifyOtp.submit", "Doğrula")
                )}
              </Button>

              <div className="space-y-2 text-center">
                <p className="text-sm text-muted-foreground">
                  {countdownLabel}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-auto p-0 text-sm"
                  disabled={sendOTP.isPending || cooldown > 0 || !phoneNumber}
                  onClick={handleResendCode}
                >
                  {sendOTP.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      {t("auth.verifyOtp.resending", "Gönderiliyor...")}
                    </>
                  ) : (
                    t("auth.verifyOtp.resend", "Kodu Tekrar Gönder")
                  )}
                </Button>
              </div>

              <div className="space-y-1 text-center text-xs text-muted-foreground">
                <p>
                  {t("auth.verifyOtp.notReceived.title", "Kod gelmedi mi?")}
                </p>
                <p>
                  {t(
                    "auth.verifyOtp.notReceived.help",
                    "Spam klasörünüzü kontrol edin veya birkaç dakika bekleyin."
                  )}
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
