//  "seller.config.ts"
//  metropolitan backend
//  Configuration for seller (company) information

import "dotenv/config";

export interface SellerInfo {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  nip: string;
  email: string;
  phone: string;
}

/**
 * Seller information for invoices - loaded from environment variables
 * Fallback to default values if environment variables are not set
 */
export const SELLER_CONFIG: SellerInfo = {
  name: process.env.SELLER_NAME || "Metropolitan Sp. z o.o.",
  address: process.env.SELLER_ADDRESS || "ul. Przykładowa 123",
  city: process.env.SELLER_CITY || "Warszawa",
  postalCode: process.env.SELLER_POSTAL_CODE || "00-001",
  country: process.env.SELLER_COUNTRY || "Polska",
  nip: process.env.SELLER_NIP || "1234567890",
  email: process.env.SELLER_EMAIL || "info@metropolitan.pl",
  phone: process.env.SELLER_PHONE || "+48 123 456 789",
};