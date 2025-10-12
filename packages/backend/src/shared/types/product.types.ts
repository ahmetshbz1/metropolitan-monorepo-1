// Product Type Definitions
// metropolitan backend

// Geçerli VAT oranları (Polonya PTU sistemi)
export type TaxRate = 0 | 5 | 7 | 8 | 23;

// Sync durumları
export type SyncStatus = "synced" | "pending" | "error";

// Fakturownia sync response
export interface FakturowniaProductResponse {
  id: number;
  name: string;
  code: string;
  quantity: number;
  tax: number;
  price_net: number;
}

// Product update payload validator
export function validateTaxRate(value: string | number | null | undefined): TaxRate {
  if (value === null || value === undefined) {
    return 23; // Default değer
  }

  const num = typeof value === "string" ? parseInt(value, 10) : value;

  if (![0, 5, 7, 8, 23].includes(num)) {
    throw new Error(`Geçersiz VAT oranı: ${value}. Geçerli değerler: 0, 5, 7, 8, 23`);
  }

  return num as TaxRate;
}

// Convert decimal string to TaxRate (5.00 -> 5)
export function parseTaxFromDecimal(value: string | number | null | undefined): TaxRate {
  if (value === null || value === undefined) {
    return 23;
  }

  const num = typeof value === "string" ? parseFloat(value) : value;
  return validateTaxRate(Math.round(num));
}
