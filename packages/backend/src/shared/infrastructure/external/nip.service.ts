//  "nip.service.ts"
//  metropolitan backend
//  Created by Ahmet on 07.07.2025.

import { NipCacheService } from "./nip-cache.service";

interface NipInfo {
  success: boolean;
  companyName?: string;
  message?: string;
  // Polish government API'den gelen detaylı bilgiler
  nip?: string;
  statusVat?: string;
  regon?: string;
  krs?: string;
  workingAddress?: string;
  registrationDate?: string;
}

/**
 * Verifies a Polish NIP number against the official government "White List" API.
 * First checks Redis cache, then fetches from API if not cached.
 * @param nip The NIP number to verify.
 * @returns An object containing the verification status and the company name if found.
 */
export async function verifyNipAndGetName(nip: string): Promise<NipInfo> {
  // Development/Test bypass
  if (process.env.NODE_ENV !== "production" && nip === "0000000000") {
    console.log(`BYPASS: Using test NIP ${nip}`);
    return {
      success: true,
      companyName: "Test B2B Company",
      nip: "0000000000",
      statusVat: "Czynny",
      regon: "123456789",
      krs: "0000123456",
      workingAddress: "Test Street 1, 00-001 Warsaw",
      registrationDate: "2020-01-01",
    };
  }

  // 1. Redis cache'den kontrol et
  const cachedResult = await NipCacheService.getCachedNip(nip);
  if (cachedResult) {
    console.log(`NIP ${nip} found in cache`);
    return cachedResult;
  }

  // 2. Cache'de yoksa API'ye git
  console.log(`NIP ${nip} not in cache, fetching from API`);
  const result = await fetchNipFromApi(nip);

  // 3. Sonucu cache'e kaydet (başarılı veya başarısız olsun)
  await NipCacheService.setCachedNip(nip, result);

  return result;
}

/**
 * Fetches NIP information from Polish government API
 */
async function fetchNipFromApi(nip: string): Promise<NipInfo> {
  const cleanedNip = nip.replace(/[-\s]/g, ""); // Remove dashes and whitespace
  const today = new Date().toISOString().split("T")[0]; // Get date in YYYY-MM-DD format
  const url = `https://wl-api.mf.gov.pl/api/search/nip/${cleanedNip}?date=${today}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      // NIP bulunamama durumu ile diğer server hataları arasında ayrım yap
      if (response.status === 404) {
        return { success: false, message: "NIP not found." };
      }
      if (response.status === 400) {
        return { success: false, message: "Invalid NIP format." };
      }
      // 500 vb. diğer hatalar için
      throw new Error(
        `Government API responded with status: ${response.status}`
      );
    }

    const data = (await response.json()) as any;

    // API response'u "result" objesine sarar, asıl veri subject içinde
    const subject = data?.result?.subject;

    if (!subject || !subject.name) {
      return {
        success: false,
        message: "NIP not found in Polish tax registry.",
      };
    }

    return {
      success: true,
      companyName: subject.name,
      nip: subject.nip,
      statusVat: subject.statusVat,
      regon: subject.regon,
      krs: subject.krs,
      workingAddress: subject.workingAddress,
      registrationDate: subject.registrationLegalDate,
    };
  } catch (error: any) {
    console.error("Error during NIP API request:", error);
    return {
      success: false,
      message: `An error occurred while trying to verify the NIP: ${error.message}`,
    };
  }
}
