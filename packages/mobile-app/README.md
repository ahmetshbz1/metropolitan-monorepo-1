# Metropolitan Mobile App

React Native + Expo mobile application for the Metropolitan e-commerce platform.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
bun install
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your backend API URL
nano .env
```

### 3. Start Development Server
```bash
# Start Expo development server
bun run start

# Run on specific platforms
bun run android
bun run ios
bun run web
```

## 🔧 Environment Variables

Required environment variables (see `.env.example` for full list):

- `EXPO_PUBLIC_API_BASE_URL` - Backend API base URL

### Development URLs:
- **iOS Simulator**: `http://localhost:3000`
- **Android Emulator**: `http://10.0.2.2:3000`
- **Physical Device**: `http://YOUR_IP_ADDRESS:3000`

## 📱 Platform Development

### iOS
```bash
# Start iOS simulator
bun run ios

# Build for iOS
bun run build:ios
```

### Android
```bash
# Start Android emulator
bun run android

# Build for Android
bun run build:android
```

### Web
```bash
# Start web development
bun run web
```

## 🧪 Quality Control

```bash
# Lint code
bun run lint

# Analyze bundle
bun run analyze
```

## 🏗️ Production Builds

```bash
# Build for production
bun run build

# Publish to Expo
bun run publish
```

## 📚 Tech Stack

- **Framework**: Expo SDK 53 + React Native 0.79
- **Router**: Expo Router v5 (file-based routing)
- **State**: React Context API + custom hooks
- **Styling**: NativeWind 4.1 (Tailwind CSS for React Native)
- **API**: Axios + JWT token interceptors
- **Storage**: Expo SecureStore
- **Payments**: Stripe React Native
- **i18n**: react-i18next (TR, EN, PL)

## 🌐 Internationalization

The app supports multiple languages:
- **Turkish** (default)
- **English**
- **Polish**

Translation files are located in `locales/` directory.

## 🔒 Security Features

- JWT token management
- Secure storage for sensitive data
- Phone number + OTP authentication
- Stripe payment integration
- Secure API communication
