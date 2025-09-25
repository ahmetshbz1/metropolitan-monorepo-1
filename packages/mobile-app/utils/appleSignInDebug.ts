import * as AppleAuthentication from 'expo-apple-authentication';
import { auth } from '@/core/firebase/firebaseConfig';
import { signOut } from 'firebase/auth';

export async function resetAppleSignIn() {
  try {
    // 1. Firebase'den çıkış yap
    await signOut(auth);
    console.log("Firebase sign out successful");

    // 2. Apple credential'ları temizle
    // Apple'ın kendi cache'ini temizlemek için yeni bir giriş başlat ve iptal et
    if (await AppleAuthentication.isAvailableAsync()) {
      try {
        // Yeni bir authentication request başlat
        const credential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
        });
        console.log("New Apple sign-in initiated:", credential.user);
      } catch (e: any) {
        // Kullanıcı iptal ederse buraya düşer
        if (e.code === 'ERR_REQUEST_CANCELED') {
          console.log("Apple sign-in cancelled - cache cleared");
        }
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Reset Apple Sign-In error:", error);
    return { success: false, error };
  }
}

export async function debugAppleAuth() {
  console.log("=== Apple Auth Debug Info ===");

  // Firebase current user
  const currentUser = auth.currentUser;
  console.log("Firebase current user:", currentUser?.uid);
  console.log("Firebase provider data:", currentUser?.providerData);

  // Apple authentication availability
  const isAvailable = await AppleAuthentication.isAvailableAsync();
  console.log("Apple Auth available:", isAvailable);

  console.log("============================");
}