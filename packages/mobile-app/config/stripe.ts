//  "stripe.ts"
//  metropolitan app
//  Created by Ahmet on 27.01.2025.

// Environment variables'dan Stripe config'ini al
const getStripePublishableKey = (): string => {
  // Expo environment variables'dan al
  const envKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  if (envKey) {
    return envKey;
  }

  // Production'da environment variable zorunlu
  throw new Error(
    "EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable is required. " +
    "Please check your .env configuration files."
  );
};

export const STRIPE_CONFIG = {
  publishableKey: getStripePublishableKey(),
  merchantIdentifier: "merchant.com.metropolitan.food", // Apple Pay için - Bundle ID ile eşleşen
  urlScheme: "metropolitan", // URL scheme app.json'dan alınıyor
} as const;

export type StripeConfig = typeof STRIPE_CONFIG;
