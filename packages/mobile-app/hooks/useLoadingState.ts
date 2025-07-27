//  "useLoadingState.ts"
//  metropolitan app
//  Created by Ahmet on 09.07.2025.

import { useState } from "react";

export const useLoadingState = () => {
  const [isLoading, setIsLoading] = useState(false);

  const withLoading = async <T>(
    operation: () => Promise<T>,
    onError?: (error: any) => void
  ): Promise<T> => {
    setIsLoading(true);
    try {
      const result = await operation();
      return result;
    } catch (error) {
      if (onError) {
        onError(error);
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    setIsLoading,
    withLoading,
  };
};