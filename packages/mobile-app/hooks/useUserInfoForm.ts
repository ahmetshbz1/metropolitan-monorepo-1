//  "useUserInfoForm.ts"
//  metropolitan app
//  Created by Ahmet on 22.06.2025.
//  Modified by Ahmet on 22.07.2025. - Optimized state management

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { startTransition, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard } from "react-native";

import { useAuth } from "@/context/AuthContext";
import { api } from "@/core/api";
import type { NipResponse } from "@metropolitan/shared";
import { isValidEmail } from "@/utils/validation";

interface UseUserInfoFormReturn {
  // values
  firstName: string;
  lastName: string;
  email: string;
  nip: string;
  companyData: NipResponse | null;
  termsAccepted: boolean;
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
}

export function useUserInfoForm(isB2B: boolean): UseUserInfoFormReturn {
  const { t } = useTranslation();
  const { completeProfile } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [nip, setNip] = useState("");

  const [companyData, setCompanyData] = useState<NipResponse | null>(null);
  const [isNipChecking, setIsNipChecking] = useState(false);
  const [isNipVerified, setIsNipVerified] = useState(false);
  const [nipError, setNipError] = useState<string | null>(null);
  const [nipWarning, setNipWarning] = useState<string | null>(null);
  const [canRegister, setCanRegister] = useState(false);

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // --- Terms acceptance persistence (temp flag from Terms screen) ---
  useFocusEffect(
    useCallback(() => {
      const checkTermsAcceptance = async () => {
        const accepted = await AsyncStorage.getItem("terms_accepted_temp");
        if (accepted === "true") {
          setTermsAccepted(true);
          await AsyncStorage.removeItem("terms_accepted_temp");
        }
      };
      checkTermsAcceptance();
    }, [])
  );

  const isFormValid = isB2B
    ? firstName.trim() !== "" &&
      lastName.trim() !== "" &&
      isValidEmail(email) &&
      isNipVerified &&
      canRegister &&
      termsAccepted
    : firstName.trim() !== "" &&
      lastName.trim() !== "" &&
      isValidEmail(email) &&
      termsAccepted;

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
    setIsSaving(true);
    const result = await completeProfile({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      userType: isB2B ? "corporate" : "individual",
      ...(isB2B && { nip: nip.trim() }),
      termsAccepted: true,
    });
    setIsSaving(false);
    if (!result.success) {
      alert(result.message);
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
  };
}
