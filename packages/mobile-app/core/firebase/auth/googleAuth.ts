import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

const useProxy = Constants.appOwnership === 'expo';

export const signInWithGoogle = async () => {
  try {
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'com.metropolitan.food',
      useProxy,
    });

    const discovery = {
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
      revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
    };

    const clientId = useProxy
      ? process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
      : process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

    if (!clientId) {
      throw new Error('Google Client ID not configured');
    }

    const request = new AuthSession.AuthRequest({
      clientId,
      scopes: ['openid', 'profile', 'email'],
      redirectUri,
      responseType: AuthSession.ResponseType.IdToken,
      usePKCE: false,
      extraParams: {
        access_type: 'offline',
        prompt: 'select_account',
      },
    });

    const result = await request.promptAsync(discovery);

    if (result.type === 'success') {
      const { id_token } = result.params;

      if (!id_token) {
        throw new Error('No ID token received from Google');
      }

      const credential = GoogleAuthProvider.credential(id_token);
      const userCredential = await signInWithCredential(auth, credential);

      const user = userCredential.user;
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
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
    console.error('Google Sign In Error:', error);
    return { success: false, error: error.message || 'Google Sign In failed' };
  }
};