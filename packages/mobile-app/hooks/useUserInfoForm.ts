//  "useUserInfoForm.ts"
//  metropolitan app
//  Created by Ahmet on 22.06.2025.
//  Modified by Ahmet on 22.07.2025. - Optimized state management

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { startTransition, useCallback, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard } from "react-native";

import { useAuth } from "@/context/AuthContext";
import { api } from "@/core/api";
import type { NipResponse } from "@metropolitan/shared";
import { isValidEmail } from "@/utils/validation";
import { useToast } from "@/hooks/useToast";

interface UseUserInfoFormReturn {
  // values
  firstName: string;
  lastName: string;
  email: string;
  nip: string;
  companyData: NipResponse | null;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  marketingAccepted: boolean;
  isFormValid: boolean;
  // status flags
  isNipChecking: boolean;
  isSaving: boolean;
  nipError: string | null;
  nipWarning: string | null;
  canRegister: boolean;
  // setters / handlers
  setFirstName: (v: string) => void;
  setLastName: (v: string) => void;
  setEmail: (v: string) => void;
  setNip: (v: string) => void;
  resetNipStatus: () => void;
  handleCheckNip: () => Promise<void>;
  handleSave: () => Promise<void>;
  setTermsAccepted: (v: boolean) => void;
  setPrivacyAccepted: (v: boolean) => void;
  setMarketingAccepted: (v: boolean) => void;
}

export function useUserInfoForm(isB2B: boolean): UseUserInfoFormReturn {
  const { t } = useTranslation();
  const { completeProfile, registrationToken, socialAuthData } = useAuth();
  const { showToast } = useToast();

  // Auto-fill from social auth data if available
  const [firstName, setFirstName] = useState(socialAuthData?.firstName || "");
  const [lastName, setLastName] = useState(socialAuthData?.lastName || "");
  const [email, setEmail] = useState(socialAuthData?.email || "");
  const [nip, setNip] = useState("");

  const [companyData, setCompanyData] = useState<NipResponse | null>(null);
  const [isNipChecking, setIsNipChecking] = useState(false);
  const [isNipVerified, setIsNipVerified] = useState(false);
  const [nipError, setNipError] = useState<string | null>(null);
  const [nipWarning, setNipWarning] = useState<string | null>(null);
  const [canRegister, setCanRegister] = useState(false);

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [marketingAccepted, setMarketingAccepted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // --- Terms and privacy acceptance persistence (temp flag from Terms screen) ---
  useFocusEffect(
    useCallback(() => {
      const checkAcceptance = async () => {
        const termsAcceptedTemp = await AsyncStorage.getItem("terms_accepted_temp");
        const privacyAcceptedTemp = await AsyncStorage.getItem("privacy_accepted_temp");

        if (termsAcceptedTemp === "true") {
          setTermsAccepted(true);
          await AsyncStorage.removeItem("terms_accepted_temp");
        }
        if (privacyAcceptedTemp === "true") {
          setPrivacyAccepted(true);
          await AsyncStorage.removeItem("privacy_accepted_temp");
        }
      };
      checkAcceptance();
    }, [])
  );

  // Auto-fill form when social auth data changes
  useEffect(() => {
    if (socialAuthData) {
      if (socialAuthData.firstName) {
        setFirstName(socialAuthData.firstName);
      }
      if (socialAuthData.lastName) {
        setLastName(socialAuthData.lastName);
      }
      if (socialAuthData.email) {
        setEmail(socialAuthData.email);
      }
    }
  }, [socialAuthData]);

  const isFormValid = isB2B
    ? firstName.trim() !== "" &&
      lastName.trim() !== "" &&
      isValidEmail(email) &&
      isNipVerified &&
      canRegister &&
      termsAccepted &&
      privacyAccepted
    : firstName.trim() !== "" &&
      lastName.trim() !== "" &&
      isValidEmail(email) &&
      termsAccepted &&
      privacyAccepted;

  // helper to reset nip-related status when input changes - optimized with transition
  const resetNipStatus = useCallback(() => {
    startTransition(() => {
      setIsNipVerified(false);
      setCanRegister(false);
      setCompanyData(null);
      setNipError(null);
      setNipWarning(null);
    });
  }, []);

  const handleCheckNip = async () => {
    if (nip.length !== 10) {
      setNipError(t("user_info.nip_error_length"));
      return;
    }

    Keyboard.dismiss();
    setIsNipChecking(true);
    resetNipStatus();

    try {
      const response = await api.post("/utils/check-nip", { nip });
      if (response.status === 400) {
        setNipError(t("user_info.nip_error_generic"));
        return;
      }
      if (response.data.success) {
        setCompanyData(response.data.data);
        setIsNipVerified(true);
        setCanRegister(true);
      } else {
        setCompanyData(response.data.data);
        setIsNipVerified(true);
        setCanRegister(false);
        setNipWarning(t("user_info.nip_inactive_company"));
      }
    } catch (err: any) {
      setNipError(
        err.response?.data?.error || t("user_info.nip_error_generic")
      );
    } finally {
      setIsNipChecking(false);
    }
  };

  const handleSave = async () => {
    if (!isFormValid) return;

    if (!registrationToken) {
      // Removed console statement
      showToast("Kayıt token'ı bulunamadı. Lütfen tekrar giriş yapın.", "error");
      return;
    }

    setIsSaving(true);
    const result = await completeProfile({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      userType: isB2B ? "corporate" : "individual",
      ...(isB2B && { nip: nip.trim() }),
      termsAccepted: termsAccepted,
      privacyAccepted: privacyAccepted,
      marketingConsent: marketingAccepted,
      ...(socialAuthData?.uid && { firebaseUid: socialAuthData.uid }),
      ...(socialAuthData?.provider && { authProvider: socialAuthData.provider }),
    });
    setIsSaving(false);

    if (!result.success) {
      showToast(result.message, "error");
    } else {
      // Marketing consent true ise notification izni otomatik olarak istenir
      if (marketingAccepted) {
        try {
          const NotificationService = await import('@/core/firebase/notifications/notificationService');
          const token = await NotificationService.default.registerForPushNotifications();

          if (token) {
            await AsyncStorage.setItem("notification_permission_asked", "true");
            await AsyncStorage.setItem("notification_permission_granted", "true");
            // Removed console statement
          }
        } catch (error) {
          // Removed console statement
        }
      }
    }
  };

  return {
    // values
    firstName,
    lastName,
    email,
    nip,
    companyData,
    termsAccepted,
    privacyAccepted,
    marketingAccepted,
    isFormValid,
    // status flags
    isNipChecking,
    isSaving,
    nipError,
    nipWarning,
    canRegister,
    // setters / handlers
    setFirstName,
    setLastName,
    setEmail,
    setNip,
    resetNipStatus,
    handleCheckNip,
    handleSave,
    setTermsAccepted,
    setPrivacyAccepted,
    setMarketingAccepted,
  };
}
