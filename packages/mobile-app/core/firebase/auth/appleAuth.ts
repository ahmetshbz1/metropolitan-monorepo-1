import * as AppleAuthentication from 'expo-apple-authentication';
import { OAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import * as Crypto from 'expo-crypto';

// Helper function to decode JWT token and get Apple User ID
function decodeJWT(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token');
    }

    // Decode the payload (second part)
    const payload = parts[1];
    // Add padding if needed
    const padded = payload + '=='.substring(0, (4 - payload.length % 4) % 4);
    const decoded = atob(padded);

    return JSON.parse(decoded);
  } catch (error) {
    // Failed to decode JWT
    return null;
  }
}

export const signInWithApple = async () => {
  try {
    const nonce = Math.random().toString(36).substring(2, 10);
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      nonce,
      { encoding: Crypto.CryptoEncoding.HEX }
    );

    const appleCredential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    const { identityToken, user: appleUserId } = appleCredential;

    if (!identityToken) {
      throw new Error('Apple Sign In failed - no identity token returned');
    }

    // Decode the identity token to get the Apple User ID (sub)
    const decodedToken = decodeJWT(identityToken);
    const appleUserIdentifier = decodedToken?.sub || appleUserId;

    if (!appleUserIdentifier) {
      throw new Error('Apple Sign In failed - no user identifier');
    }

    const provider = new OAuthProvider('apple.com');
    const credential = provider.credential({
      idToken: identityToken,
      rawNonce: nonce,
    });

    const userCredential = await signInWithCredential(auth, credential);

    const user = userCredential.user;
    // Apple ilk girişte bilgi verir, sonrakilerde vermez
    const firstName = appleCredential.fullName?.givenName || null;
    const lastName = appleCredential.fullName?.familyName || null;
    const fullName = firstName && lastName
      ? `${firstName} ${lastName}`.trim()
      : firstName || lastName || null;

    const userData = {
      uid: user.uid, // Firebase UID
      appleUserId: appleUserIdentifier, // Apple's unique user ID - THIS IS CRITICAL!
      email: user.email || appleCredential.email,
      fullName: fullName,
      firstName: firstName,
      lastName: lastName,
      photoURL: user.photoURL,
      provider: 'apple',
    };

    // Apple Sign In - User Data logged

    return { success: true, user: userData };
  } catch (error: any) {
    if (error.code === 'ERR_REQUEST_CANCELED') {
      return { success: false, error: 'Apple Sign In was cancelled' };
    }
    // Apple Sign In Error
    return { success: false, error: error.message || 'Apple Sign In failed' };
  }
};

export const checkAppleAuthAvailable = async () => {
  try {
    const isAvailable = await AppleAuthentication.isAvailableAsync();
    return isAvailable;
  } catch {
    return false;
  }
};