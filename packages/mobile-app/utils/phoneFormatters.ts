//  "phoneFormatters.ts"
//  metropolitan app
//  Created by Ahmet on 13.06.2025.

export interface PhoneParseResult {
  countryCode: string;
  phoneNumber: string;
}

export const parsePhoneNumber = (text: string): PhoneParseResult => {
  const cleanedText = text.replace(/\s/g, "");

  if (cleanedText.startsWith("+")) {
    const fullNumber = cleanedText.substring(1);

    // Heuristic: Assume 2-digit country code if length is typical for TR/PL.
    if (fullNumber.length === 11 || fullNumber.length === 12) {
      return {
        countryCode: fullNumber.substring(0, 2),
        phoneNumber: fullNumber.substring(2),
      };
    } else {
      // Fallback for other formats, tries to leave a reasonable number length.
      const cc = fullNumber.substring(0, fullNumber.length - 10);
      const num = fullNumber.substring(fullNumber.length - 10);

      if (cc.length > 0 && cc.length <= 3) {
        return {
          countryCode: cc,
          phoneNumber: num,
        };
      } else {
        return {
          countryCode: "",
          phoneNumber: text, // Can't parse, put full text in number field
        };
      }
    }
  }

  return {
    countryCode: "",
    phoneNumber: text,
  };
};

export const validatePhoneInput = (
  phoneNumber: string,
  countryCode: string
): boolean => {
  return phoneNumber.length > 5 && countryCode.length > 0;
};

export const formatFullPhoneNumber = (
  phoneNumber: string,
  countryCode: string
): string => {
  return `+${countryCode}${phoneNumber.replace(/\s/g, "")}`;
};

export const getMaxPhoneLength = (countryCode: string): number => {
  // Türkiye (90) ve Polonya (48) için özel kurallar
  switch (countryCode) {
    case "90": // Türkiye
      return 10; // 5XX XXX XX XX
    case "48": // Polonya
      return 9; // XXX XXX XXX
    default:
      return 12; // Genel maksimum
  }
};

export const PHONE_INPUT_CONFIG = {
  maxCountryCodeLength: 3,
  minPhoneNumberLength: 6,
  placeholder: "555 555 55 55",
} as const;
