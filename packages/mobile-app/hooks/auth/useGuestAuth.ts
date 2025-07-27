//  "useGuestAuth.ts"
//  metropolitan app
//  Created by Ahmet on 27.07.2025.

import {
  createGuestSession,
  generateGuestId,
  migrateGuestData,
} from "@/context/auth/guestUtils";
import { guestStorage } from "@/context/auth/storage";

interface GuestAuthActions {
  loginAsGuest: () => Promise<void>;
  migrateGuestToUser: (phoneNumber: string, guestId: string) => Promise<void>;
}

export const useGuestAuth = (
  setIsGuest: (value: boolean) => void,
  setGuestId: (value: string | null) => void
): GuestAuthActions => {
  const loginAsGuest = async (): Promise<void> => {
    const newGuestId = generateGuestId();
    const result = await createGuestSession(newGuestId);

    if (result.success) {
      setIsGuest(true);
      setGuestId(newGuestId);
      await guestStorage.saveGuestId(newGuestId);
    } else {
      console.error("Misafir oturumu oluşturulamadı");
    }
  };

  const migrateGuestToUser = async (
    phoneNumber: string,
    guestId: string
  ): Promise<void> => {
    try {
      await migrateGuestData(phoneNumber, guestId);
      await guestStorage.clearGuest();
      setGuestId(null);
      setIsGuest(false);
    } catch (error) {
      console.error("Misafir verisi taşıma hatası:", error);
      throw error;
    }
  };

  return {
    loginAsGuest,
    migrateGuestToUser,
  };
};