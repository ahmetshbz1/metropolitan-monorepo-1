//  "photoService.ts"
//  metropolitan app
//  Created by Ahmet on 27.07.2025.

import { api } from "@/core/api";

// Profil fotoğrafı yükle
export const uploadProfilePhoto = async (
  imageUri: string
): Promise<{ success: boolean; message: string; photoUrl?: string }> => {
  try {
    const formData = new FormData();
    
    // Dosya adını ve türünü URI'den çıkarmaya çalış
    const filename = imageUri.split("/").pop() || "photo.jpg";
    const match = /\.(\w+)$/.exec(filename);
    let type = "image/jpeg"; // Varsayılan tip
    
    if (match) {
      const ext = match[1].toLowerCase();
      if (ext === "png") {
        type = "image/png";
      } else if (ext === "jpg" || ext === "jpeg") {
        type = "image/jpeg";
      } else if (ext === "gif") {
        type = "image/gif";
      }
    }
    
    // React Native FormData için doğru format
    const photo = {
      uri: imageUri,
      type: type,
      name: filename,
    };
    
    // @ts-ignore - React Native FormData tipi farklı
    formData.append("photo", photo);
    
    const response = await api.post("/users/me/profile-photo", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    const data = response.data;
    if (data.success && data.data.photoUrl) {
      return {
        success: true,
        message: data.message,
        photoUrl: data.data.photoUrl,
      };
    } else {
      return {
        success: false,
        message: data.message || "Fotoğraf yükleme başarısız.",
      };
    }
  } catch (e: any) {
    console.error("Fotoğraf yükleme başarısız:", e.response?.data || e.message);
    return {
      success: false,
      message: e.response?.data?.message || e.message,
    };
  }
};