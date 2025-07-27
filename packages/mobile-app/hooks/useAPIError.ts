//  "useAPIError.ts"
//  metropolitan app
//  Created by Ahmet on 09.07.2025.

import { useTranslation } from "react-i18next";

export const useAPIError = () => {
  const { t, i18n } = useTranslation();

  const handleStructuredError = (error: any, setError: (error: string | null) => void, defaultErrorKey: string) => {
    // Auth error'ı olduğu gibi fırlat
    if (error.code === "AUTH_REQUIRED" || error.code === "MIN_QUANTITY_ERROR") {
      throw error;
    }
    
    // Backend'den gelen structured error'ı handle et
    const errorPayload = error.response?.data;
    const key = errorPayload?.key;

    if (key && i18n.exists(`errors.${key}`)) {
      const params = errorPayload.params;
      const translatedMessage = t(`errors.${key}`, params);
      setError(translatedMessage);
      
      // Error'ı structured olarak fırlat
      const structuredError = new Error(translatedMessage);
      (structuredError as any).key = key;
      (structuredError as any).params = params;
      throw structuredError;
    } else {
      // Generic error
      const defaultMessage = t(defaultErrorKey);
      setError(defaultMessage);
      throw new Error(defaultMessage);
    }
  };

  return {
    handleStructuredError,
  };
};