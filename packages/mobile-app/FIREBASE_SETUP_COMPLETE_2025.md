# 🔥 Firebase Complete Setup Guide - Expo SDK 53/54 (Eylül 2025)

## ⚠️ KRİTİK UYARI: SDK VERSİYON SEÇİMİ

### 📅 Eylül 2025 Durumu:
- **Expo SDK 54** - Eylül 2025'te çıktı (React Native 0.81)
- **Expo SDK 53** - Hala stable ve yaygın kullanımda (React Native 0.79)
- **Expo SDK 55** - Q4 2025'te çıkacak (sadece New Architecture destekleyecek)

### 🎯 Önerilen: SDK 53 Kullanın
SDK 54 çok yeni, SDK 53 daha stable. Firebase için SDK 53 öneriyoruz.

---

## 🚨 BİLİNEN HATALAR VE ÇÖZÜMLERİ

### ❌ HATA 1: "Component auth has not been registered yet"
**Sebep:** Firebase JS SDK ile Expo SDK 53 uyumsuzluğu
**Çözüm:** React Native Firebase'e geçiş yapın (aşağıda detaylı anlatım)

### ❌ HATA 2: "Dual Package Hazard"
**Sebep:** Hem ESM hem CommonJS modül yüklenmesi
**Çözüm:** metro.config.js düzenlemesi (aşağıda kod var)

### ❌ HATA 3: Push notifications Android'de çalışmıyor
**Sebep:** SDK 53'te Expo Go desteği kaldırıldı
**Çözüm:** Development build kullanın (EAS Build)

### ❌ HATA 4: iOS build hatası - use_frameworks
**Sebep:** Firebase iOS SDK framework gerektiriyor
**Çözüm:** expo-build-properties ile "useFrameworks": "static"

---

## ✅ DOĞRU KURULUM ADIMLARI

### 📦 ADIM 1: Temiz Kurulum

```bash
# ÖNCE: Eski Firebase paketlerini temizleyin
npm uninstall firebase firebase-admin

# Cache temizliği
npx expo prebuild --clear
rm -rf node_modules
rm -rf ios android
npm cache clean --force

# Yeni kurulum
npm install

# Development client (ZORUNLU)
npx expo install expo-dev-client
```

### 📦 ADIM 2: React Native Firebase Kurulumu

```bash
# Firebase Core (ZORUNLU)
npx expo install @react-native-firebase/app

# Authentication
npx expo install @react-native-firebase/auth

# Push Notifications
npx expo install @react-native-firebase/messaging
npx expo install expo-notifications
npx expo install expo-device
npx expo install expo-constants

# Analytics & Monitoring
npx expo install @react-native-firebase/analytics
npx expo install @react-native-firebase/crashlytics
npx expo install @react-native-firebase/perf

# Social Auth
npx expo install expo-apple-authentication
npx expo install @react-native-google-signin/google-signin

# iOS için build properties
npx expo install expo-build-properties
```

---

## ⚙️ ADIM 3: metro.config.js (KRİTİK!)

```javascript
// packages/mobile-app/metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Firebase JS SDK kullanacaksanız (ÖNERİLMEZ)
// config.resolver.sourceExts.push('cjs');
// config.resolver.unstable_enablePackageExports = false;

// React Native Firebase için (ÖNERİLEN)
config.resolver.blockList = [
  /node_modules\/.*\/node_modules\/react-native\/.*/,
];

module.exports = config;
```

---

## 📱 ADIM 4: app.json Konfigürasyonu (GÜNCEL)

```json
{
  "expo": {
    "name": "metropolitan",
    "slug": "metropolitan",
    "version": "1.0.2",
    "orientation": "portrait",
    "scheme": "metropolitan",
    "newArchEnabled": true,
    "plugins": [
      "@react-native-firebase/app",
      "@react-native-firebase/auth",
      "@react-native-firebase/messaging",
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
            "minSdkVersion": 23,
            "buildToolsVersion": "34.0.0"
          }
        }
      ],
      [
        "expo-notifications",
        {
          "icon": "./assets/images/notification-icon.png",
          "color": "#ffffff",
          "defaultChannel": "default"
        }
      ],
      "expo-apple-authentication"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.metropolitan.food",
      "googleServicesFile": "./GoogleService-Info.plist",
      "usesAppleSignIn": true,
      "infoPlist": {
        "UIBackgroundModes": ["remote-notification"],
        "CFBundleAllowMixedLocalizations": true
      },
      "entitlements": {
        "aps-environment": "production"
      }
    },
    "android": {
      "package": "com.metropolitan.food",
      "googleServicesFile": "./google-services.json",
      "permissions": [
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE",
        "SCHEDULE_EXACT_ALARM",
        "com.google.android.c2dm.permission.RECEIVE"
      ]
    }
  }
}
```

---

## 🔑 ADIM 5: Firebase Console Setup

### Firebase Projesi:
1. [Firebase Console](https://console.firebase.google.com) → Create Project
2. Project name: `metropolitan-food-2025`
3. Google Analytics: Enable

### iOS App Ekleme:
1. iOS bundle ID: `com.metropolitan.food`
2. App nickname: Metropolitan iOS
3. `GoogleService-Info.plist` indir
4. Root dizine koy (mobile-app/)

### Android App Ekleme:
1. Package name: `com.metropolitan.food`
2. App nickname: Metropolitan Android
3. SHA-1 certificate ekle (debug + release)
4. `google-services.json` indir
5. Root dizine koy (mobile-app/)

### SHA-1 Certificate (Android):
```bash
# Debug SHA-1
cd android && ./gradlew signingReport

# Release SHA-1 (EAS Build kullanıyorsanız)
eas credentials
```

---

## 🔐 ADIM 6: Environment Variables

```bash
# packages/mobile-app/.env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=metropolitan-food-2025.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=metropolitan-food-2025
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=metropolitan-food-2025.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:ios:abc123

# Google Sign-In
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=123456-abc.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=123456-xyz.apps.googleusercontent.com
```

---

## 💻 ADIM 7: Firebase Service Implementation

```typescript
// packages/mobile-app/services/firebase/index.ts
import { Platform } from 'react-native';
import auth from '@react-native-firebase/auth';
import messaging from '@react-native-firebase/messaging';
import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// HATA KONTROLÜ: Device check
if (!Device.isDevice) {
  console.warn('Firebase services require physical device');
}

// Google Sign-In Config
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID!,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  offlineAccess: true,
  forceCodeForRefreshToken: true,
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
  private static initialized = false;

  static async initialize() {
    if (this.initialized) return;

    try {
      // Analytics'i etkinleştir
      await analytics().setAnalyticsCollectionEnabled(true);

      // Crashlytics'i etkinleştir
      await crashlytics().setCrashlyticsCollectionEnabled(true);

      // Background message handler
      messaging().setBackgroundMessageHandler(async (remoteMessage) => {
        console.log('Background message:', remoteMessage);
      });

      this.initialized = true;
      console.log('Firebase initialized successfully');
    } catch (error) {
      console.error('Firebase initialization error:', error);
      // HATA: App'i crashlemeyin, devam edin
    }
  }

  // Apple Sign-In
  static async signInWithApple() {
    try {
      // Check availability
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Apple Sign-In not available on this device');
      }

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error('No identity token received');
      }

      const appleCredential = auth.AppleAuthProvider.credential(
        credential.identityToken,
        credential.authorizationCode || undefined
      );

      const userCredential = await auth().signInWithCredential(appleCredential);

      // Analytics
      await analytics().logLogin({ method: 'apple' });

      return {
        success: true,
        user: userCredential.user,
        idToken: await userCredential.user.getIdToken(),
        additionalInfo: {
          email: credential.email,
          fullName: credential.fullName,
        }
      };
    } catch (error: any) {
      await crashlytics().recordError(error);

      if (error.code === 'ERR_REQUEST_CANCELED') {
        return { success: false, cancelled: true };
      }

      throw error;
    }
  }

  // Google Sign-In
  static async signInWithGoogle() {
    try {
      // Play Services check (Android)
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }

      const userInfo = await GoogleSignin.signIn();

      if (!userInfo.idToken) {
        throw new Error('No ID token received from Google');
      }

      const googleCredential = auth.GoogleAuthProvider.credential(userInfo.idToken);
      const userCredential = await auth().signInWithCredential(googleCredential);

      // Analytics
      await analytics().logLogin({ method: 'google' });

      return {
        success: true,
        user: userCredential.user,
        idToken: await userCredential.user.getIdToken(),
      };
    } catch (error: any) {
      await crashlytics().recordError(error);

      if (error.code === GoogleSignin.statusCodes.SIGN_IN_CANCELLED) {
        return { success: false, cancelled: true };
      }

      if (error.code === GoogleSignin.statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play Services not available');
      }

      throw error;
    }
  }

  // FCM Token Management
  static async getFCMToken(): Promise<string | null> {
    try {
      // Request permission first
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.log('FCM permission not granted');
        return null;
      }

      // Get FCM token
      const token = await messaging().getToken();

      if (token) {
        console.log('FCM Token obtained:', token.substring(0, 20) + '...');
        await analytics().logEvent('fcm_token_obtained');
      }

      return token;
    } catch (error) {
      console.error('FCM token error:', error);
      await crashlytics().recordError(error as Error);
      return null;
    }
  }

  // Token refresh listener
  static onTokenRefresh(callback: (token: string) => void) {
    return messaging().onTokenRefresh(async (token) => {
      console.log('FCM token refreshed');
      await analytics().logEvent('fcm_token_refreshed');
      callback(token);
    });
  }

  // Foreground message handler
  static onMessage(callback: (message: any) => void) {
    return messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground message received:', remoteMessage);

      // Show local notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: remoteMessage.notification?.title || 'New Message',
          body: remoteMessage.notification?.body || '',
          data: remoteMessage.data,
        },
        trigger: null,
      });

      callback(remoteMessage);
    });
  }

  // Analytics helpers
  static async logEvent(eventName: string, params?: any) {
    try {
      await analytics().logEvent(eventName, params);
    } catch (error) {
      console.error('Analytics error:', error);
    }
  }

  static async setUserId(userId: string) {
    try {
      await analytics().setUserId(userId);
      await crashlytics().setUserId(userId);
    } catch (error) {
      console.error('Set user ID error:', error);
    }
  }

  static async setUserProperties(properties: Record<string, string>) {
    try {
      for (const [key, value] of Object.entries(properties)) {
        await analytics().setUserProperty(key, value);
      }
    } catch (error) {
      console.error('Set user properties error:', error);
    }
  }
}
```

---

## 🏗️ ADIM 8: EAS Build Configuration

```json
// packages/mobile-app/eas.json
{
  "cli": {
    "version": ">= 7.8.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_ENV": "development"
      },
      "ios": {
        "resourceClass": "m-medium",
        "simulator": true
      },
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleDebug"
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_ENV": "preview"
      },
      "ios": {
        "resourceClass": "m-medium"
      },
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true,
      "env": {
        "EXPO_PUBLIC_ENV": "production"
      },
      "ios": {
        "resourceClass": "m-medium"
      },
      "android": {
        "buildType": "aab"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "64XKK46655"
      },
      "android": {
        "track": "internal",
        "releaseStatus": "draft"
      }
    }
  }
}
```

---

## 🚀 ADIM 9: Build & Test

### Development Build:
```bash
# Clean install
rm -rf node_modules ios android
npm install
npx expo prebuild --clean

# iOS (Mac only)
npx expo run:ios --device

# Android
npx expo run:android --device

# EAS Build (Önerilen)
eas build --platform all --profile development
```

### Test Checklist:
```bash
✅ Apple Sign-In çalışıyor mu?
✅ Google Sign-In çalışıyor mu?
✅ FCM token alınabiliyor mu?
✅ Push notification permission isteniyor mu?
✅ Foreground notification gösteriliyor mu?
✅ Background notification çalışıyor mu?
✅ Analytics event'leri Firebase Console'da görünüyor mu?
✅ Crashlytics test crash'i görünüyor mu?
```

---

## 🐛 TROUBLESHOOTING

### iOS Sorunları:

**Pod install hatası:**
```bash
cd ios
pod deintegrate
pod install --repo-update
```

**use_frameworks hatası:**
```bash
# Podfile'a ekle
use_frameworks! :linkage => :static
```

### Android Sorunları:

**Gradle build hatası:**
```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

**Multidex hatası:**
```gradle
// android/app/build.gradle
android {
  defaultConfig {
    multiDexEnabled true
  }
}
```

### Common Issues:

**"Invariant Violation: Native module cannot be null"**
- Development build gerekli, Expo Go'da çalışmaz

**"No Firebase App has been initialized"**
- GoogleService-Info.plist ve google-services.json kontrol et

**"Duplicate Firebase/React Native modules"**
- node_modules sil, clean install yap

---

## ✅ PRODUCTION CHECKLIST

- [ ] Firebase Console'da production API keys oluşturuldu
- [ ] Apple Push Notification certificate yüklendi
- [ ] FCM Server Key (V1) oluşturuldu
- [ ] SHA-1 ve SHA-256 fingerprints eklendi (release)
- [ ] App Store Connect'te Sign In with Apple etkin
- [ ] Google Play Console'da OAuth consent screen hazır
- [ ] Privacy Policy URL'leri güncel
- [ ] Analytics ve Crashlytics etkin
- [ ] Test cihazları Firebase'den exclude edildi
- [ ] Rate limiting ve security rules aktif

---

## 📊 PERFORMANS ÖNERİLERİ

1. **Lazy Loading:** Firebase servislerini ihtiyaç anında yükleyin
2. **Token Caching:** FCM token'ı SecureStore'da cache'leyin
3. **Offline Support:** Firestore offline persistence aktif edin
4. **Bundle Size:** Kullanmadığınız Firebase modüllerini yüklemeyin
5. **Analytics Sampling:** Production'da sampling rate ayarlayın

---

## 🔗 KAYNAKLAR

- [Expo Firebase Docs](https://docs.expo.dev/guides/using-firebase/)
- [React Native Firebase](https://rnfirebase.io/)
- [Firebase Console](https://console.firebase.google.com)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [GitHub Issues - SDK 53](https://github.com/expo/expo/issues/36588)

---

**Son Güncelleme:** 25 Eylül 2025
**Test Edildi:** Expo SDK 53 & 54
**React Native:** 0.79 (SDK 53) / 0.81 (SDK 54)

---

## 📞 DESTEK

Sorun yaşarsanız:
1. Bu dökümanı baştan kontrol edin
2. Firebase Console loglarını kontrol edin
3. `npx expo doctor` çalıştırın
4. GitHub Issues'da arayın

**NOT:** Bu rehber production-ready ve test edilmiştir. Tüm adımları sırasıyla takip edin.