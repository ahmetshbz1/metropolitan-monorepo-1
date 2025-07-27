//  "useProfileManagement.ts"
//  metropolitan app
//  Created by Ahmet on 27.07.2025.

import { User } from "@/context/auth/types";
import {
  fetchUserProfile,
  processUserData,
  updateUserProfile as updateUserProfileService,
  uploadProfilePhoto as uploadProfilePhotoService,
} from "@/context/auth/authServices";
import { userStorage } from "@/context/auth/storage";

interface ProfileManagementActions {
  updateUserProfile: (
    userData: Partial<Omit<User, "phone" | "profilePicture">>
  ) => Promise<{ success: boolean; message: string }>;
  uploadProfilePhoto: (
    imageUri: string
  ) => Promise<{ success: boolean; message: string }>;
  refreshUserProfile: () => Promise<void>;
}

export const useProfileManagement = (
  token: string | null,
  setUser: (user: User | null) => void
): ProfileManagementActions => {
  const updateUserProfile = async (
    userData: Partial<Omit<User, "phone" | "profilePicture">>
  ) => {
    if (!token) {
      return {
        success: false,
        message: "Kimlik doğrulama token'ı bulunamadı.",
      };
    }

    const result = await updateUserProfileService(userData);

    if (result.success && result.data) {
      setUser(result.data);
      await userStorage.save(result.data);
    }

    return { success: result.success, message: result.message };
  };

  const uploadProfilePhoto = async (imageUri: string) => {
    if (!token) {
      return {
        success: false,
        message: "Kimlik doğrulama token'ı bulunamadı.",
      };
    }

    const result = await uploadProfilePhotoService(imageUri);

    if (result.success && result.photoUrl) {
      // Kullanıcı state'ini yeni fotoğraf URL'si ile güncelle
      setUser((currentUser) => {
        if (!currentUser) return null;
        const updatedUser = {
          ...currentUser,
          profilePhotoUrl: result.photoUrl!,
        };
        const processedUser = processUserData(updatedUser);
        // Storage'ı da güncelle
        userStorage.save(processedUser);
        return processedUser;
      });
    }

    return { success: result.success, message: result.message };
  };

  const refreshUserProfile = async (): Promise<void> => {
    if (!token) return;

    const result = await fetchUserProfile();

    if (result.success && result.user) {
      setUser(result.user);
      await userStorage.save(result.user);
    }
  };

  return {
    updateUserProfile,
    uploadProfilePhoto,
    refreshUserProfile,
  };
};