// "social-auth-token-extractor.ts"
// metropolitan backend
// Token extraction logic for social auth linking flow

import type {
  JWTService,
  SocialAuthHeaders,
  DecodedAccessToken,
} from "./social-auth-types";

/**
 * Authorization header'dan mevcut kullanıcı ID'sini çıkarır
 *
 * Bu fonksiyon linking flow için kullanılır:
 * - Authorization header varsa, zaten login olmuş kullanıcının ID'sini döner
 * - Bu sayede social provider'ı mevcut hesaba bağlayabiliriz
 * - Token geçersizse veya yoksa undefined döner (sign-in flow)
 *
 * @param headers - HTTP headers
 * @param jwt - JWT service
 * @returns Kullanıcı ID'si veya undefined
 */
export async function extractCurrentUserId(
  headers: SocialAuthHeaders,
  jwt: JWTService
): Promise<string | undefined> {
  try {
    const authHeader = (headers["authorization"] || headers["Authorization"]) as
      | string
      | undefined;

    if (!authHeader?.startsWith("Bearer ")) {
      return undefined;
    }

    const token = authHeader.slice(7);
    const decoded = (await jwt.verify(token)) as DecodedAccessToken | false;

    if (decoded && decoded.sub && decoded.type === "access") {
      return decoded.sub;
    }

    return undefined;
  } catch (error) {
    // Token doğrulama hatası - sign-in flow olarak devam et
    return undefined;
  }
}
