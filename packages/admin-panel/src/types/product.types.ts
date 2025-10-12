// Frontend Product Type Definitions

// Geçerli VAT oranları
export type TaxRate = 0 | 5 | 7 | 8 | 23;

// Sync durumları
export type SyncStatus = "synced" | "pending" | "error";

// VAT validation ve conversion
export function validateTaxRate(value: string | number | null | undefined): TaxRate {
  if (value === null || value === undefined) {
    return 23;
  }

  const num = typeof value === "string" ? parseInt(value, 10) : value;

  if (![0, 5, 7, 8, 23].includes(num)) {
    console.error(`Geçersiz VAT oranı: ${value}. Default 23 kullanılıyor.`);
    return 23;
  }

  return num as TaxRate;
}

// Parse tax from any format to TaxRate
export function parseTax(tax: number | string | null | undefined): TaxRate {
  if (tax === null || tax === undefined) return 23;

  const num = typeof tax === "string" ? parseFloat(tax) : tax;
  return validateTaxRate(Math.round(num));
}

// Convert TaxRate to string for Select component
export function taxRateToString(tax: TaxRate | number | null | undefined): string {
  if (tax === null || tax === undefined) return "";
  return Math.round(Number(tax)).toString();
}
