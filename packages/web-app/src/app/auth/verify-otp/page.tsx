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
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const OTP_LENGTH = 6;
const RESEND_DELAY_SECONDS = 60;

export default function VerifyOtpPage() {
  const { t } = useTranslation();
  const { verifyOTP, sendOTP } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const phoneParam = searchParams.get("phone") || "";
  const userTypeParam = searchParams.get("userType");

  const phoneNumber = phoneParam;
  const userType = useMemo<"individual" | "corporate">(() => {
    return userTypeParam === "corporate" ? "corporate" : "individual";
  }, [userTypeParam]);

  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
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

    if (isVerifying) {
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

    setIsVerifying(true);
    setError(null);
    setInfo(null);

    try {
      const result = await verifyOTP(phoneNumber, otpCode, userType);

      if (result.success) {
        if (result.isNewUser) {
          router.replace(`/auth/complete-profile?userType=${userType}`);
        } else {
          router.replace("/");
        }
        return;
      }

      setError(
        result.message ||
          t(
            "auth.verifyOtp.errors.verifyFailed",
            "Doğrulama kodu kontrol edilirken bir hata oluştu."
          )
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (isResending || cooldown > 0 || !phoneNumber) {
      return;
    }

    setIsResending(true);
    setError(null);
    setInfo(null);
    setOtpCode("");

    try {
      const result = await sendOTP(phoneNumber, userType);

      if (result.success) {
        setCooldown(RESEND_DELAY_SECONDS);
        setInfo(
          result.message ||
            t("auth.verifyOtp.info.resent", "Yeni doğrulama kodu gönderildi.")
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
    } finally {
      setIsResending(false);
    }
  };

  const handleOtpComplete = () => {
    verifyButtonRef.current?.focus();
  };

  const countdownLabel = useMemo(() => {
    if (cooldown <= 0) {
      return t(
        "auth.verifyOtp.resendReady",
        "Tekrar kod gönderebilirsiniz."
      );
    }
    return t("auth.verifyOtp.resendIn", "Tekrar kod için {{second}} sn.", {
      second: cooldown,
    });
  }, [cooldown, t]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/auth/phone-login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("auth.verifyOtp.back", "Geri Dön")}
            </Link>
          </Button>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-4 text-center">
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
                  disabled={isVerifying}
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
                  otpCode.length !== OTP_LENGTH || isVerifying || !phoneNumber
                }
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("auth.verifyOtp.verifying", "Doğrulanıyor...")}
                  </>
                ) : (
                  t("auth.verifyOtp.submit", "Doğrula")
                )}
              </Button>

              <div className="space-y-2 text-center">
                <p className="text-sm text-muted-foreground">{countdownLabel}</p>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-auto p-0 text-sm"
                  disabled={isResending || cooldown > 0 || !phoneNumber}
                  onClick={handleResendCode}
                >
                  {isResending ? (
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
                <p>{t("auth.verifyOtp.notReceived.title", "Kod gelmedi mi?")}</p>
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
