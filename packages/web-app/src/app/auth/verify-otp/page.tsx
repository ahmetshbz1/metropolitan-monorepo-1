"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OTPInput } from "@/components/ui/otp-input";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Loader2, Shield } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export default function VerifyOTPPage() {
  const { t } = useTranslation();
  const { verifyOTP, sendOTP } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const phoneNumber = searchParams.get("phone") || "";
  const userType = (searchParams.get("userType") as "individual" | "corporate") || "individual";

  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleOTPComplete = () => {
    handleVerifyOTP();
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) {
      setError("Lütfen 6 haneli doğrulama kodunu giriniz");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await verifyOTP(phoneNumber, otpCode, userType);
      if (result.success) {
        if (result.isNewUser) {
          // New user, redirect to complete profile
          router.push("/auth/complete-profile");
        } else {
          // Existing user, redirect to home
          router.push("/");
        }
      } else {
        setError(result.message);
      }
    } catch (error: any) {
      setError(error.message || "Doğrulama kodu kontrol edilirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    setError("");
    setOtpCode("");

    try {
      const result = await sendOTP(phoneNumber, userType);
      if (result.success) {
        setCountdown(60);
        setCanResend(false);
      } else {
        setError(result.message);
      }
    } catch (error: any) {
      setError(error.message || "Kod tekrar gönderilirken bir hata oluştu");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/auth/phone-login">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Geri Dön
            </Link>
          </Button>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Doğrulama Kodu</CardTitle>
              <CardDescription className="text-base">
                {phoneNumber} numarasına gönderilen 6 haneli kodu giriniz
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* OTP Input */}
            <div className="space-y-4">
              <OTPInput
                value={otpCode}
                onChange={setOtpCode}
                onComplete={handleOTPComplete}
                isError={!!error}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground text-center">
                6 haneli doğrulama kodunu giriniz
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                {error}
              </div>
            )}

            {/* Verify Button */}
            <Button
              onClick={handleVerifyOTP}
              disabled={otpCode.length !== 6 || loading}
              className="w-full h-11"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Doğrulanıyor...
                </>
              ) : (
                "Doğrula"
              )}
            </Button>

            {/* Resend Code */}
            <div className="text-center space-y-2">
              {canResend ? (
                <Button
                  variant="ghost"
                  onClick={handleResendCode}
                  disabled={resendLoading}
                  className="h-auto p-0 text-sm"
                >
                  {resendLoading ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Gönderiliyor...
                    </>
                  ) : (
                    "Kodu Tekrar Gönder"
                  )}
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Kodu tekrar gönderebilirsiniz: {countdown}s
                </p>
              )}
            </div>

            {/* Help Text */}
            <div className="text-xs text-center text-muted-foreground space-y-1">
              <p>Kod gelmedi mi?</p>
              <p>Spam klasörünüzü kontrol edin veya birkaç dakika bekleyin.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}