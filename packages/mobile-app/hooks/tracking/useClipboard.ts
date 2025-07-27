//  "useClipboard.ts"
//  metropolitan app
//  Created by Ahmet on 27.07.2025.

import { useState } from "react";
import * as Clipboard from "expo-clipboard";
import { useHaptics } from "@/hooks/useHaptics";

export const useClipboard = () => {
  const { triggerHaptic } = useHaptics();
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      triggerHaptic("light");

      // Kopyalandı feedback'i göster
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000); // 2 saniye sonra gizle
    } catch (error) {
      console.error("Error copying to clipboard:", error);
    }
  };

  return {
    copied,
    copyToClipboard,
  };
};