import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { Platform } from "react-native";

import { auth } from "../firebaseConfig";

let isConfigured = false;

const configureGoogleSignin = () => {
  if (isConfigured) {
    return;
  }

  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

  if (!webClientId) {
    throw new Error("Google Web Client ID not configured");
  }

  GoogleSignin.configure({
    webClientId,
    iosClientId: iosClientId ?? undefined,
    androidClientId: androidClientId ?? undefined,
    offlineAccess: true,
    forceCodeForRefreshToken: false,
  });

  isConfigured = true;
};

const parseDisplayName = (displayName?: string | null) => {
  if (!displayName) {
    return { firstName: null, lastName: null };
  }

  const parts = displayName.trim().split(" ");

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: null };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" ") || null,
  };
};

export const signInWithGoogle = async () => {
  try {
    configureGoogleSignin();

    if (Platform.OS === "android") {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
    }

    await GoogleSignin.signOut().catch(() => {});

    const userInfo = await GoogleSignin.signIn();
    const tokens = await GoogleSignin.getTokens();

    if (!tokens.idToken) {
      throw new Error("Google idToken alınamadı");
    }

    const credential = GoogleAuthProvider.credential(tokens.idToken, tokens.accessToken);
    const userCredential = await signInWithCredential(auth, credential);

    const { user } = userCredential;
    const { firstName, lastName } = parseDisplayName(user.displayName);

    return {
      success: true as const,
      user: {
        uid: user.uid,
        email: user.email,
        fullName: user.displayName,
        firstName,
        lastName,
        photoURL: user.photoURL,
        provider: "google" as const,
      },
    };
  } catch (error: any) {
    if (error?.code === statusCodes.SIGN_IN_CANCELLED) {
      return { success: false as const, error: "Google Sign In was cancelled" };
    }

    if (error?.code === statusCodes.IN_PROGRESS) {
      return { success: false as const, error: "Google Sign In is in progress" };
    }

    if (error?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return { success: false as const, error: "Google Play Services not available" };
    }

    return {
      success: false as const,
      error: error?.message ?? "Google Sign In failed",
    };
  }
};
