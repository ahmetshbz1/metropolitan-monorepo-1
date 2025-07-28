//  "BusinessInfoSection.tsx"
//  metropolitan app
//  Created by Ahmet on 20.06.2025.
//  Modified by Ahmet on 22.07.2025. - Stable scroll optimization

import React, { memo, useState } from "react";
import { Text, TextInput, View } from "react-native";
import type { NipResponse } from "@metropolitan/shared";

import { CompanyDataCard } from "./business/CompanyDataCard";
import { NipInput } from "./business/NipInput";
import { NipStatusMessage } from "./business/NipStatusMessage";

interface BusinessInfoSectionProps {
  nip: string;
  setNip: (val: string) => void;
  nipRef: React.RefObject<TextInput | null>;
  isNipChecking: boolean;
  nipError: string | null;
  nipWarning: string | null;
  companyData: NipResponse | null;
  canRegister: boolean;
  themeColors: any;
  t: (key: string) => string;
  handleCheckNip: () => void;
  resetNipStatus: () => void;
}

function BusinessInfoSectionComponent(props: BusinessInfoSectionProps) {
  const {
    nip,
    setNip,
    nipRef,
    isNipChecking,
    nipError,
    nipWarning,
    companyData,
    canRegister,
    themeColors,
    t,
    handleCheckNip,
    resetNipStatus,
  } = props;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_isNipInputFocused, setIsNipInputFocused] = useState(false);

  return (
    <View className="mb-6">
      <Text
        className="text-lg font-semibold mb-4 opacity-90"
        style={{ color: themeColors.text }}
      >
        {t("user_info.business_info_section") || "İş Bilgileri"}
      </Text>

      <View className="mb-4">
        <NipInput
          nip={nip}
          setNip={setNip}
          nipRef={nipRef}
          isNipChecking={isNipChecking}
          themeColors={themeColors}
          t={t}
          handleCheckNip={handleCheckNip}
          resetNipStatus={resetNipStatus}
          onFocus={() => {
            setIsNipInputFocused(true);
          }}
          onBlur={() => setIsNipInputFocused(false)}
        />

        <NipStatusMessage
          nipError={nipError}
          nipWarning={nipWarning}
          themeColors={themeColors}
        />

        {companyData && (
          <CompanyDataCard
            companyData={companyData}
            canRegister={canRegister}
            themeColors={themeColors}
            t={t}
          />
        )}
      </View>
    </View>
  );
}

// Memoized export for stable re-renders
export const BusinessInfoSection = memo(BusinessInfoSectionComponent);
