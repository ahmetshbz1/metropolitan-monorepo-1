import * as AppleAuthentication from 'expo-apple-authentication';
import { OAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import * as Crypto from 'expo-crypto';

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

    const { identityToken } = appleCredential;

    if (!identityToken) {
      throw new Error('Apple Sign In failed - no identity token returned');
    }

    const provider = new OAuthProvider('apple.com');
    const credential = provider.credential({
      idToken: identityToken,
      rawNonce: nonce,
    });

    const userCredential = await signInWithCredential(auth, credential);

    const user = userCredential.user;
    const userData = {
      uid: user.uid,
      email: user.email || appleCredential.email,
      fullName: appleCredential.fullName
        ? `${appleCredential.fullName.givenName || ''} ${appleCredential.fullName.familyName || ''}`.trim()
        : null,
      photoURL: user.photoURL,
      provider: 'apple',
    };

    return { success: true, user: userData };
  } catch (error: any) {
    if (error.code === 'ERR_REQUEST_CANCELED') {
      return { success: false, error: 'Apple Sign In was cancelled' };
    }
    console.error('Apple Sign In Error:', error);
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