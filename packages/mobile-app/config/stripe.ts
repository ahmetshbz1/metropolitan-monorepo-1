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

  // Development fallback
  if (__DEV__) {
    return "pk_test_51Rj0tDQHq6QQUavV20vExgXEqmYuJeS1oQO4lNRpp8oshQd4jXsTwnUOD90FxKOJYRk2GSgZOtZ0ensDq8JBTfbG004feFyHVq";
  }

  throw new Error(
    "EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable is required for production"
  );
};

export const STRIPE_CONFIG = {
  publishableKey: getStripePublishableKey(),
  merchantIdentifier: "merchant.com.ahmetshbzz.metropolitan", // Apple Pay için
  urlScheme: "metropolitan", // URL scheme app.json'dan alınıyor
} as const;

export type StripeConfig = typeof STRIPE_CONFIG;
