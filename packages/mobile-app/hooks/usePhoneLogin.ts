//  "usePhoneLogin.ts"
//  metropolitan app
//  Created by Ahmet on 15.06.2025.

import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/context/AuthContext";
import { parsePhoneNumber, validatePhoneInput } from "@/utils/phoneFormatters";

export const usePhoneLogin = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type?: string }>();
  const { sendOTP } = useAuth();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("48");
  const [loading, setLoading] = useState(false);
  const [countryCodeSelection, setCountryCodeSelection] = useState<
    { start: number; end: number } | undefined
  >();

  const handlePhoneInputChange = (text: string) => {
    const { countryCode: newCountryCode, phoneNumber: newPhoneNumber } =
      parsePhoneNumber(text);

    if (newCountryCode) {
      setCountryCode(newCountryCode);
      setPhoneNumber(newPhoneNumber);
    } else {
      setPhoneNumber(text);
    }
  };

  const handleCountryCodeChange = (text: string) => {
    setCountryCode(text);
    setCountryCodeSelection(undefined);
  };

  const handleCountryCodeFocus = () => {
    setCountryCodeSelection({
      start: countryCode.length,
      end: countryCode.length,
    });
  };

  const handleCountryCodeBlur = () => {
    setCountryCodeSelection(undefined);
  };

  const handleSendCode = async () => {
    const fullPhoneNumber = `+${countryCode}${phoneNumber.replace(/\s/g, "")}`;

    if (!validatePhoneInput(phoneNumber, countryCode)) {
      return;
    }

    setLoading(true);
    const userType = type === "b2b" ? "corporate" : "individual";
    const { success, message } = await sendOTP(fullPhoneNumber, userType);
    setLoading(false);

    if (success) {
      router.push({
        pathname: "/(auth)/otp",
        params: { phone: fullPhoneNumber, type },
      });
    } else {
      throw new Error(message);
    }
  };

  const isButtonDisabled =
    loading || !validatePhoneInput(phoneNumber, countryCode);

  return {
    phoneNumber,
    countryCode,
    loading,
    countryCodeSelection,
    isButtonDisabled,
    handlePhoneInputChange,
    handleCountryCodeChange,
    handleCountryCodeFocus,
    handleCountryCodeBlur,
    handleSendCode,
    t,
  };
};
