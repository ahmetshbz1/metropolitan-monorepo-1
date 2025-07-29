// "address-management.service.ts"
// metropolitan backend
// Address parsing and management operations

import { db } from "../../../../shared/infrastructure/database/connection";
import { addresses } from "../../../../shared/infrastructure/database/schema";

interface ParsedAddress {
  street: string;
  postalCode: string;
  city: string;
  country: string;
}

export class AddressManagementService {
  /**
   * Polish address format'ını parse eder
   * Format: "ŚWIĘTOKRZYSKA 36, 00-116 WARSZAWA"
   */
  static parsePolishAddress(workingAddress: string): ParsedAddress {
    // Regular expression to match Polish address format
    // Captures: street, postal code, city
    const addressRegex = /^(.+?),\s*(\d{2}-\d{3})\s+(.+)$/;
    const match = workingAddress.match(addressRegex);

    if (match) {
      return {
        street: match[1]!.trim(),
        postalCode: match[2]!.trim(),
        city: match[3]!.trim(),
        country: "Poland",
      };
    }

    // Fallback: full address as street if parsing fails
    return {
      street: workingAddress,
      postalCode: "",
      city: "",
      country: "Poland",
    };
  }

  /**
   * Create billing address from company working address
   */
  static async createBillingAddress(
    userId: string,
    workingAddress: string
  ): Promise<void> {
    const parsedAddress = this.parsePolishAddress(workingAddress);
    
    await db.insert(addresses).values({
      userId: userId,
      addressTitle: "Fatura Adresi",
      street: parsedAddress.street,
      city: parsedAddress.city,
      postalCode: parsedAddress.postalCode,
      country: parsedAddress.country,
    });
  }

  /**
   * Create generic address
   */
  static async createAddress(
    userId: string,
    addressData: {
      title: string;
      street: string;
      city: string;
      postalCode: string;
      country: string;
      details?: string;
    }
  ): Promise<void> {
    await db.insert(addresses).values({
      userId: userId,
      addressTitle: addressData.title,
      street: addressData.street,
      city: addressData.city,
      postalCode: addressData.postalCode,
      country: addressData.country,
      addressDetails: addressData.details,
    });
  }
}