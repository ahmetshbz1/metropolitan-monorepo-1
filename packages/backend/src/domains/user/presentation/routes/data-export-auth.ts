// "data-export-auth.ts"
// metropolitan backend
// Auth validation logic for data export routes

interface JWTProfile {
  sub?: string;
  userId?: string;
}

interface AuthResult {
  isValid: boolean;
  userId: string | null;
}

/**
 * JWT token'dan userId'yi çıkart
 * sub veya userId field'larından birini kullanır
 */
export function extractUserId(profile: JWTProfile | undefined): string | null {
  if (!profile) {
    return null;
  }

  return profile.sub || profile.userId || null;
}

/**
 * Profile ve userId'nin geçerliliğini kontrol et
 * Her endpoint'te kullanılan ortak auth validation
 */
export function validateAuth(profile: JWTProfile | undefined): AuthResult {
  const userId = extractUserId(profile);

  return {
    isValid: Boolean(profile && userId),
    userId,
  };
}
