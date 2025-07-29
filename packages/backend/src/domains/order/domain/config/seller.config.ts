//  "seller.config.ts"
//  metropolitan backend
//  Configuration for seller (company) information

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
 * Default seller information for invoices
 * TODO: Move to environment variables or database configuration
 */
export const SELLER_CONFIG: SellerInfo = {
  name: "Metropolitan Sp. z o.o.",
  address: "ul. Przykładowa 123",
  city: "Warszawa",
  postalCode: "00-001",
  country: "Polska",
  nip: "1234567890",
  email: "info@metropolitan.pl",
  phone: "+48 123 456 789",
};