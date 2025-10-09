import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

const useProxy = Constants.appOwnership === 'expo';

export const signInWithGoogle = async () => {
  try {
    // Development build'de native client ID, Expo Go'da web client ID
    const isExpoGo = Constants.appOwnership === 'expo';

    // Native build'de custom scheme, Expo Go'da proxy kullan
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: isExpoGo ? undefined : 'com.metropolitan.food',
      useProxy: isExpoGo,
    });

    const discovery = {
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
      revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
    };

    // Native build'de iOS client ID, Expo Go'da web client ID
    const clientId = isExpoGo
      ? process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
      : process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

    if (!clientId) {
      throw new Error(`Google ${isExpoGo ? 'Web' : 'iOS'} Client ID not configured`);
    }

    const request = new AuthSession.AuthRequest({
      clientId,
      scopes: ['openid', 'profile', 'email'],
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
      extraParams: {
        access_type: 'offline',
        prompt: 'select_account',
      },
    });

    const result = await request.promptAsync(discovery);

    if (result.type === 'success') {
      if (!result.params.code) {
        throw new Error('No authorization code received from Google');
      }

      // Removed console statement

      // Exchange code for tokens
      const tokenResult = await AuthSession.exchangeCodeAsync(
        {
          clientId,
          code: result.params.code,
          redirectUri,
          extraParams: request.codeVerifier
            ? { code_verifier: request.codeVerifier }
            : undefined,
        },
        discovery
      );

      // Removed console statement);

      // Google OAuth 2.0'da idToken farklı key'lerde olabilir
      const id_token = tokenResult.idToken || tokenResult.id_token;
      const access_token = tokenResult.accessToken || tokenResult.access_token;

      if (!id_token) {
        // Token result does not contain ID token
        throw new Error('No ID token received from Google');
      }

      const credential = GoogleAuthProvider.credential(id_token, access_token);
      const userCredential = await signInWithCredential(auth, credential);

      const user = userCredential.user;

      // Parse first and last name from displayName
      const nameParts = user.displayName?.split(' ') || [];
      const firstName = nameParts[0] || null;
      const lastName = nameParts.slice(1).join(' ') || null;

      const userData = {
        uid: user.uid,
        email: user.email,
        fullName: user.displayName,
        firstName: firstName,
        lastName: lastName,
        photoURL: user.photoURL,
        provider: 'google',
      };

      return { success: true, user: userData };
    } else if (result.type === 'cancel') {
      return { success: false, error: 'Google Sign In was cancelled' };
    } else {
      return { success: false, error: 'Google Sign In failed' };
    }
  } catch (error: any) {
    // Google Sign In Error
    return { success: false, error: error.message || 'Google Sign In failed' };
  }
};