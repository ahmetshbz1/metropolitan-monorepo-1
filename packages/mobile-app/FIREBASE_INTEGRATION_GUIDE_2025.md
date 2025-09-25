# 🔥 Firebase Integration Guide for Metropolitan App - Expo SDK 53 (2025)

## ⚠️ EXPO SDK 53 KRİTİK DEĞİŞİKLİKLER

### 2025'te Firebase Entegrasyonu İçin Bilinmesi Gerekenler:
1. **React Native Firebase Kullanılmalı** (Firebase JS SDK değil - performans ve özellikler için)
2. **Development Build Zorunlu** (Expo Go artık desteklemiyor)
3. **Push Notifications Android'de Expo Go'da çalışmaz** (SDK 53 değişikliği)
4. **Apple Sign-In zorunlu** (Google Sign-In varsa App Store kuralı)
5. **FCM V1 API kullanılmalı** (Legacy FCM deprecated)
6. **Node 20+ gerekli** (Node 18 EOL - Nisan 2025)

---

## 📦 ADIM 1: Paket Kurulumları

```bash
# Development build için gerekli
npx expo install expo-dev-client

# Firebase Core
npx expo install @react-native-firebase/app

# Authentication
npx expo install @react-native-firebase/auth
npx expo install expo-apple-authentication
npx expo install @react-native-google-signin/google-signin

# Push Notifications
npx expo install @react-native-firebase/messaging
npx expo install expo-notifications
npx expo install expo-device
npx expo install expo-constants

# Analytics & Monitoring
npx expo install @react-native-firebase/analytics
npx expo install @react-native-firebase/crashlytics
npx expo install @react-native-firebase/perf

# iOS için gerekli
npx expo install expo-build-properties
```

---

## 🔧 ADIM 2: Firebase Proje Kurulumu

### Firebase Console'da:
1. [Firebase Console](https://console.firebase.google.com) açın
2. "Metropolitan Food" projesi oluşturun
3. iOS ve Android uygulamaları ekleyin:
   - iOS Bundle ID: `com.metropolitan.food`
   - Android Package: `com.metropolitan.food`

### Servis Dosyalarını İndirin:
- `google-services.json` (Android)
- `GoogleService-Info.plist` (iOS)

Dosyaları şuraya koyun:
```
packages/mobile-app/
├── google-services.json
└── GoogleService-Info.plist
```

---

## ⚙️ ADIM 3: app.json Konfigürasyonu

```json
{
  "expo": {
    "plugins": [
      "@react-native-firebase/app",
      "@react-native-firebase/auth",
      "@react-native-firebase/crashlytics",
      [
        "expo-build-properties",
        {
          "ios": {
            "useFrameworks": "static",
            "deploymentTarget": "13.4"
          },
          "android": {
            "compileSdkVersion": 34,
            "targetSdkVersion": 34,
            "minSdkVersion": 23
          }
        }
      ],
      [
        "expo-notifications",
        {
          "icon": "./assets/images/notification-icon.png",
          "color": "#ffffff",
          "defaultChannel": "default",
          "sounds": ["./assets/sounds/notification.wav"]
        }
      ],
      "expo-apple-authentication"
    ],
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist",
      "usesAppleSignIn": true,
      "infoPlist": {
        "UIBackgroundModes": ["remote-notification"]
      }
    },
    "android": {
      "googleServicesFile": "./google-services.json",
      "permissions": [
        "android.permission.RECEIVE_BOOT_COMPLETED",
        "android.permission.VIBRATE",
        "com.google.android.c2dm.permission.RECEIVE"
      ]
    }
  }
}
```

---

## 🔐 ADIM 4: Firebase Config (firebase.ts)

```typescript
// packages/mobile-app/config/firebase.ts
import auth from '@react-native-firebase/auth';
import messaging from '@react-native-firebase/messaging';
import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Google Sign-In Konfigürasyonu
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  offlineAccess: true,
});

// Notification Handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class FirebaseService {
  // Analytics
  static async logEvent(eventName: string, params?: Record<string, any>) {
    await analytics().logEvent(eventName, params);
  }

  static async setUserId(userId: string) {
    await analytics().setUserId(userId);
    await crashlytics().setUserId(userId);
  }

  // Crashlytics
  static async recordError(error: Error, fatal = false) {
    if (fatal) {
      await crashlytics().recordError(error, fatal);
    } else {
      await crashlytics().log(error.message);
    }
  }

  // Apple Sign In
  static async signInWithApple() {
    try {
      // Apple kimlik doğrulama isteği başlat
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Firebase için token oluştur
      const { identityToken, nonce } = credential;
      const appleCredential = auth.AppleAuthProvider.credential(
        identityToken,
        nonce
      );

      // Firebase'e giriş yap
      const userCredential = await auth().signInWithCredential(appleCredential);

      // Backend'e gönder
      return {
        user: userCredential.user,
        idToken: await userCredential.user.getIdToken(),
        additionalUserInfo: {
          email: credential.email,
          fullName: credential.fullName,
        }
      };
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        throw new Error('Apple Sign-In iptal edildi');
      }
      throw error;
    }
  }

  // Google Sign In
  static async signInWithGoogle() {
    try {
      // Google hesap seçimi
      await GoogleSignin.hasPlayServices();
      const { idToken } = await GoogleSignin.signIn();

      // Firebase credential oluştur
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);

      // Firebase'e giriş yap
      const userCredential = await auth().signInWithCredential(googleCredential);

      return {
        user: userCredential.user,
        idToken: await userCredential.user.getIdToken(),
      };
    } catch (error: any) {
      if (error.code === 'SIGN_IN_CANCELLED') {
        throw new Error('Google Sign-In iptal edildi');
      }
      throw error;
    }
  }

  // Push Notifications
  static async requestNotificationPermissions() {
    if (Platform.OS === 'android') {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        throw new Error('Notification permission denied');
      }
    }

    if (Platform.OS === 'ios') {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        throw new Error('Notification permission denied');
      }
    }

    return true;
  }

  static async getFCMToken(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('FCM token not available on simulator');
      return null;
    }

    try {
      const fcmToken = await messaging().getToken();
      console.log('FCM Token:', fcmToken);
      return fcmToken;
    } catch (error) {
      console.error('FCM token error:', error);
      return null;
    }
  }

  static async onTokenRefresh(callback: (token: string) => void) {
    return messaging().onTokenRefresh(callback);
  }

  static async onMessage(callback: (message: any) => void) {
    return messaging().onMessage(async (remoteMessage) => {
      console.log('FCM message received:', remoteMessage);
      callback(remoteMessage);
    });
  }

  static async onBackgroundMessage() {
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Background message:', remoteMessage);
    });
  }
}
```

---

## 🎯 ADIM 5: AuthContext Güncellemesi

```typescript
// packages/mobile-app/context/AuthContext.tsx güncelleme
import { FirebaseService } from '@/config/firebase';

// Yeni metodlar ekle
const signInWithApple = async () => {
  try {
    setIsLoading(true);
    const firebaseAuth = await FirebaseService.signInWithApple();

    // Backend'e gönder
    const response = await api.post('/auth/social-login', {
      provider: 'apple',
      idToken: firebaseAuth.idToken,
      email: firebaseAuth.additionalUserInfo.email,
      fullName: firebaseAuth.additionalUserInfo.fullName,
    });

    if (response.data.success) {
      await SecureStore.setItemAsync('token', response.data.token);
      setUser(response.data.user);

      // Analytics
      await FirebaseService.setUserId(response.data.user.id);
      await FirebaseService.logEvent('login', { method: 'apple' });
    }
  } catch (error) {
    await FirebaseService.recordError(error as Error);
    throw error;
  } finally {
    setIsLoading(false);
  }
};

const signInWithGoogle = async () => {
  try {
    setIsLoading(true);
    const firebaseAuth = await FirebaseService.signInWithGoogle();

    // Backend'e gönder
    const response = await api.post('/auth/social-login', {
      provider: 'google',
      idToken: firebaseAuth.idToken,
    });

    if (response.data.success) {
      await SecureStore.setItemAsync('token', response.data.token);
      setUser(response.data.user);

      // Analytics
      await FirebaseService.setUserId(response.data.user.id);
      await FirebaseService.logEvent('login', { method: 'google' });
    }
  } catch (error) {
    await FirebaseService.recordError(error as Error);
    throw error;
  } finally {
    setIsLoading(false);
  }
};
```

---

## 📱 ADIM 6: Push Notification Setup

```typescript
// packages/mobile-app/hooks/usePushNotifications.ts
import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { FirebaseService } from '@/config/firebase';
import { api } from '@/core/api';
import { useAuth } from '@/context/AuthContext';

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState<Notifications.Notification | undefined>();
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();
  const { user } = useAuth();

  useEffect(() => {
    registerForPushNotifications();

    // Notification alındığında
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
      FirebaseService.logEvent('notification_received', {
        title: notification.request.content.title,
        body: notification.request.content.body,
      });
    });

    // Notification'a tıklandığında
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;

      FirebaseService.logEvent('notification_opened', {
        action: data.action,
        orderId: data.orderId,
      });

      // Navigate based on notification type
      if (data.action === 'order_update' && data.orderId) {
        // Navigate to order detail
        router.push(`/order/${data.orderId}`);
      }
    });

    // FCM token listener
    FirebaseService.onTokenRefresh(async (token) => {
      await updateBackendToken(token);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  const registerForPushNotifications = async () => {
    try {
      await FirebaseService.requestNotificationPermissions();

      const fcmToken = await FirebaseService.getFCMToken();
      if (fcmToken) {
        setExpoPushToken(fcmToken);
        await updateBackendToken(fcmToken);
      }
    } catch (error) {
      console.error('Push notification setup error:', error);
      await FirebaseService.recordError(error as Error);
    }
  };

  const updateBackendToken = async (token: string) => {
    if (user) {
      try {
        await api.post('/user/update-fcm-token', { fcmToken: token });
      } catch (error) {
        console.error('FCM token update error:', error);
      }
    }
  };

  return {
    expoPushToken,
    notification,
  };
}
```

---

## 🚀 ADIM 7: Login Screen Güncellemesi

```tsx
// packages/mobile-app/app/(auth)/index.tsx güncelleme
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

export default function LoginScreen() {
  const { signInWithApple, signInWithGoogle } = useAuth();

  return (
    <View className="flex-1 p-4">
      {/* Existing phone login */}

      {/* Social Login Buttons */}
      <View className="mt-6">
        <ThemedText className="text-center mb-4">
          {t('auth.or_continue_with')}
        </ThemedText>

        {/* Apple Sign In - iOS'ta zorunlu */}
        {Platform.OS === 'ios' && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={12}
            style={{ width: '100%', height: 50, marginBottom: 12 }}
            onPress={signInWithApple}
          />
        )}

        {/* Google Sign In */}
        <TouchableOpacity
          onPress={signInWithGoogle}
          className="bg-white border border-gray-300 rounded-xl p-3 flex-row items-center justify-center"
        >
          <Image
            source={require('@/assets/images/google-logo.png')}
            className="w-5 h-5 mr-2"
          />
          <Text className="text-gray-900 font-semibold">
            {t('auth.sign_in_with_google')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
```

---

## 🔄 ADIM 8: Backend Güncellemesi

```typescript
// packages/backend/src/domains/identity/presentation/routes/social-auth.routes.ts
import { Elysia } from 'elysia';
import admin from 'firebase-admin';

// Firebase Admin SDK initialization
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const socialAuthRoutes = new Elysia({ prefix: '/auth' })
  .post('/social-login', async ({ body }) => {
    const { provider, idToken, email, fullName } = body;

    try {
      // Firebase token doğrulama
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const firebaseUid = decodedToken.uid;

      // Kullanıcıyı bul veya oluştur
      let user = await db.query.users.findFirst({
        where: eq(users.firebaseUid, firebaseUid)
      });

      if (!user) {
        // Yeni kullanıcı oluştur
        user = await userService.createSocialUser({
          firebaseUid,
          email,
          fullName,
          provider,
        });
      }

      // JWT token oluştur
      const token = await jwtService.generateToken(user);

      return {
        success: true,
        user,
        token,
      };
    } catch (error) {
      throw new Error('Social authentication failed');
    }
  })
  .post('/user/update-fcm-token', async ({ body, profile }) => {
    const { fcmToken } = body;
    const userId = profile.sub;

    await db.update(users)
      .set({ fcmToken, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return { success: true };
  });
```

---

## 🏗️ ADIM 9: Development Build

```bash
# iOS development build
npx expo prebuild -p ios --clean
npx expo run:ios --device

# Android development build
npx expo prebuild -p android --clean
npx expo run:android --device

# EAS Build (önerilen)
eas build --platform all --profile development
```

---

## 📋 Environment Variables (.env)

```bash
# Firebase Configuration
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_client_id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_ios_client_id.apps.googleusercontent.com
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=metropolitan-food.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=metropolitan-food
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=metropolitan-food.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:ios:abcdef
```

---

## ✅ Test Checklist

- [ ] Apple Sign-In çalışıyor (iOS)
- [ ] Google Sign-In çalışıyor
- [ ] FCM token alınıyor
- [ ] Push notification izinleri isteniyor
- [ ] Foreground notification alınıyor
- [ ] Background notification alınıyor
- [ ] Analytics event'leri gönderiliyor
- [ ] Crashlytics hataları kaydediliyor
- [ ] Social login backend entegrasyonu

---

## 🚨 Önemli Notlar

1. **Development Build Zorunlu**: Expo Go artık Firebase'i desteklemiyor
2. **Apple Sign-In Zorunlu**: Google Sign-In varsa App Store reddeder
3. **FCM V1 API**: Legacy FCM artık kullanılmıyor
4. **iOS useFrameworks**: Firebase iOS SDK için gerekli
5. **Backend Hazırlığı**: Social auth endpoints hazır olmalı

---

## 📅 Tahmini Süre

- **Gün 1-2**: Firebase proje setup & konfigürasyon
- **Gün 3-4**: Authentication implementasyonu
- **Gün 5-6**: Push notifications & Analytics
- **Gün 7**: Backend entegrasyonu
- **Gün 8-10**: Test & debugging

**Toplam: 8-10 gün**

---

## 🔗 Faydalı Linkler

- [Expo Firebase Guide](https://docs.expo.dev/guides/using-firebase/)
- [React Native Firebase](https://rnfirebase.io/)
- [Apple Sign-In](https://docs.expo.dev/versions/latest/sdk/apple-authentication/)
- [Google Sign-In](https://github.com/react-native-google-signin/google-signin)
- [FCM V1 Migration](https://firebase.google.com/docs/cloud-messaging/migrate-v1)

---

**Son Güncelleme:** 25 Eylül 2025
**Expo SDK:** 53
**React Native:** 0.79.5