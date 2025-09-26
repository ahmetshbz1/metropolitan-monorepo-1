import * as AppleAuthentication from 'expo-apple-authentication';
import { auth } from '@/core/firebase/firebaseConfig';
import { signOut } from 'firebase/auth';

export async function resetAppleSignIn() {
  try {
    // 1. Firebase'den çıkış yap
    await signOut(auth);
    // Removed console statement

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
        // Removed console statement
      } catch (e: any) {
        // Kullanıcı iptal ederse buraya düşer
        if (e.code === 'ERR_REQUEST_CANCELED') {
          // Removed console statement
        }
      }
    }

    return { success: true };
  } catch (error) {
    // Removed console statement
    return { success: false, error };
  }
}

export async function debugAppleAuth() {
  // Removed console statement

  // Firebase current user
  const currentUser = auth.currentUser;
  // Removed console statement
  // Removed console statement

  // Apple authentication availability
  const isAvailable = await AppleAuthentication.isAvailableAsync();
  // Removed console statement

  // Removed console statement
}