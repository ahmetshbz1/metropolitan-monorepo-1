//  "useOTP.ts"
//  metropolitan app
//  Created by Ahmet on 04.07.2025.

import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";

const RESEND_TIMEOUT = 20;

interface UseOTPProps {
  onSuccess: (isNewUser: boolean) => void;
}

export const useOTP = ({ onSuccess }: UseOTPProps) => {
  const { phone, type } = useLocalSearchParams<{
    phone: string;
    type?: string;
  }>();
  const { verifyOTP, sendOTP } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [resendTimer, setResendTimer] = useState(RESEND_TIMEOUT);
  const [isResendActive, setIsResendActive] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isResendActive) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev > 1) {
            return prev - 1;
          }
          setIsResendActive(false);
          return 0;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isResendActive]);

  const handleVerifyCode = useCallback(async () => {
    if (code.length === 6) {
      setLoading(true);
      setError(false);
      setErrorMessage("");

      if (!phone) {
        setError(true);
        setErrorMessage(t("otp.phone_not_found_error"));
        setLoading(false);
        return;
      }

      try {
        const userType = type === "b2b" ? "corporate" : "individual";
        const { success, message, isNewUser } = await verifyOTP(
          phone,
          code,
          userType
        );
        if (success) {
          onSuccess(isNewUser);
        } else {
          throw new Error(message);
        }
      } catch (err: any) {
        setError(true);
        setErrorMessage(err.message || t("otp.invalid_code_error"));
      } finally {
        setLoading(false);
      }
    } else {
      setError(true);
      setErrorMessage(t("otp.code_length_error"));
    }
  }, [code, onSuccess, t, phone, verifyOTP]);

  const handleResendCode = useCallback(async () => {
    if (phone && !isResendActive) {
      const userType = type === "b2b" ? "corporate" : "individual";
      await sendOTP(phone, userType); // Fire-and-forget is okay here
      setResendTimer(RESEND_TIMEOUT);
      setIsResendActive(true);
    }
  }, [phone, type, sendOTP, isResendActive]);

  const clearError = () => {
    setError(false);
    setErrorMessage("");
  };

  useEffect(() => {
    setIsResendActive(true);
  }, []);

  return {
    code,
    setCode,
    loading,
    error,
    errorMessage,
    resendTimer,
    handleVerifyCode,
    handleResendCode,
    clearError,
  };
};
