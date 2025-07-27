//  "useAddToCartState.ts"
//  metropolitan app
//  Created by Ahmet on 27.07.2025.

import { useEffect, useRef, useState } from "react";
import { useHaptics } from "@/hooks/useHaptics";

export const useAddToCartState = () => {
  const { triggerHaptic } = useHaptics();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showAddedText, setShowAddedText] = useState(false);
  
  // Race condition koruması için ref
  const isProcessingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const startLoading = () => {
    setIsLoading(true);
  };

  const showSuccess = () => {
    setIsLoading(false);
    setIsSuccess(true);
    setShowAddedText(true);
    
    // Sepete ekleme başarılı olunca hafif titreşim
    triggerHaptic("light", true);
  };

  const hideSuccess = (delay: number = 2000) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setIsSuccess(false);
      setShowAddedText(false);
      timeoutRef.current = null;
    }, delay) as any;
  };

  const showError = () => {
    setIsLoading(false);
  };

  return {
    isLoading,
    isSuccess,
    showAddedText,
    isProcessingRef,
    startLoading,
    showSuccess,
    hideSuccess,
    showError,
  };
};