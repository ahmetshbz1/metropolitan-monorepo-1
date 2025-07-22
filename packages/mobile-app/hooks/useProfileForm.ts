//  "useProfileForm.ts"
//  metropolitan app
//  Created by Ahmet on 15.07.2025.
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/context/AuthContext";
import { isValidEmail } from "@/utils/validation";

export function useProfileForm() {
  const { t } = useTranslation();
  const { user, updateUserProfile } = useAuth();
  const router = useRouter();

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [emailBlurred, setEmailBlurred] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!user) return;

    if (!isValidEmail(email)) {
      throw new Error(t("edit_profile.email_invalid"));
    }

    const changedData: Partial<typeof user> = {};
    if (firstName !== user.firstName) {
      changedData.firstName = firstName;
    }
    if (lastName !== user.lastName) {
      changedData.lastName = lastName;
    }
    if (email !== user.email) {
      changedData.email = email;
    }

    if (Object.keys(changedData).length === 0) {
      router.back();
      return;
    }

    setLoading(true);
    const { success, message } = await updateUserProfile(changedData);
    setLoading(false);

    if (success) {
      router.back();
      // Success durumunu return edelim, component toast göstersin
      return { success: true, message: t("edit_profile.success_message") };
    } else {
      throw new Error(message);
    }
  };

  return {
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    emailBlurred,
    setEmailBlurred,
    loading,
    handleSave,
    isSaveDisabled: loading || !isValidEmail(email),
  };
}
