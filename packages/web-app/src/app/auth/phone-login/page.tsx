"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Loader2, Phone } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function PhoneLoginPage() {
  const { t } = useTranslation();
  const { sendOTP, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [countryCode, setCountryCode] = useState("48");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [userType, setUserType] = useState<"individual" | "corporate">("individual");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const fullPhoneNumber = `+${countryCode}${phoneNumber}`;
  const isValidPhoneNumber = countryCode.length >= 2 && phoneNumber.length >= 7;

  const handleSendOTP = async () => {
    if (!isValidPhoneNumber) {
      setError("Lütfen geçerli bir telefon numarası giriniz");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await sendOTP(fullPhoneNumber, userType);
      if (result.success) {
        // Navigate to OTP verification page
        router.push(`/auth/verify-otp?phone=${encodeURIComponent(fullPhoneNumber)}&userType=${userType}`);
      } else {
        setError(result.message);
      }
    } catch (error: any) {
      setError(error.message || "OTP gönderilirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError("");

    try {
      const result = await signInWithGoogle();
      if (!result.success && result.error) {
        setError(result.error);
      }
    } catch (error: any) {
      setError(error.message || "Google giriş başarısız");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Ana Sayfaya Dön
            </Link>
          </Button>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Phone className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Telefon ile Giriş</CardTitle>
              <CardDescription className="text-base">
                Size bir doğrulama kodu göndereceğiz
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* User Type Selection */}
            <div className="space-y-3">
              <Label>Hesap Türü</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={userType === "individual" ? "default" : "outline"}
                  onClick={() => setUserType("individual")}
                  className="h-11"
                >
                  Bireysel
                </Button>
                <Button
                  type="button"
                  variant={userType === "corporate" ? "default" : "outline"}
                  onClick={() => setUserType("corporate")}
                  className="h-11"
                >
                  Kurumsal
                </Button>
              </div>
            </div>

            {/* Phone Number Input */}
            <div className="space-y-2">
              <Label>Telefon Numarası</Label>
              <div className="flex gap-3">
                <div className="w-20">
                  <Input
                    type="tel"
                    placeholder="+48"
                    value={`+${countryCode}`}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\+/g, '');
                      if (/^\d{0,4}$/.test(cleaned)) {
                        setCountryCode(cleaned);
                      }
                    }}
                    className="h-11 bg-muted/50 border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary text-center font-medium"
                    maxLength={5}
                  />
                </div>
                <div className="flex-1">
                  <Input
                    type="tel"
                    placeholder="555 123 456"
                    value={phoneNumber}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\D/g, '');
                      setPhoneNumber(cleaned);
                    }}
                    className="h-11 bg-muted/50 border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    maxLength={15}
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                {error}
              </div>
            )}

            {/* Send OTP Button */}
            <Button
              onClick={handleSendOTP}
              disabled={!isValidPhoneNumber || loading}
              className="w-full h-11"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Kod Gönderiliyor...
                </>
              ) : (
                "Doğrulama Kodu Gönder"
              )}
            </Button>

            {/* Conditional Content - Google Sign In for B2C, Info Text for B2B */}
            {userType === "individual" ? (
              <>
                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      veya
                    </span>
                  </div>
                </div>

                {/* Google Sign In */}
                <Button
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                  className="w-full h-11"
                >
                  {googleLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Google ile giriş yapılıyor...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Google ile Giriş Yap
                    </>
                  )}
                </Button>
              </>
            ) : (
              /* B2B Information Text */
              <div className="flex justify-center items-center py-6">
                <p className="text-sm text-muted-foreground text-center max-w-[80%]">
                  {t("auth.phoneLogin.b2bNote")}
                </p>
              </div>
            )}

            {/* Terms */}
            <p className="text-xs text-center text-muted-foreground">
              Devam ederek{" "}
              <Link href="/terms" className="underline hover:text-foreground">
                Kullanım Koşulları
              </Link>{" "}
              ve{" "}
              <Link href="/privacy" className="underline hover:text-foreground">
                Gizlilik Politikası
              </Link>
              &apos;nı kabul etmiş olursunuz.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}