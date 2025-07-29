// "company-management.service.ts"
// metropolitan backend
// Company creation and management operations

import type { CompanyInfo } from "@metropolitan/shared/types/user";
import { eq } from "drizzle-orm";
import { db } from "../../../../shared/infrastructure/database/connection";
import { companies } from "../../../../shared/infrastructure/database/schema";

export class CompanyManagementService {
  /**
   * Şirket bulma veya oluşturma
   */
  static async findOrCreateCompany(
    nip: string,
    companyName: string
  ): Promise<CompanyInfo> {
    // Mevcut şirketi ara
    let company = await db.query.companies.findFirst({
      where: eq(companies.nip, nip),
    });

    // Şirket yoksa oluştur
    if (!company) {
      const newCompany = await db
        .insert(companies)
        .values({
          name: companyName,
          nip: nip,
        })
        .returning();

      company = newCompany[0];
    }

    if (!company) {
      throw new Error("Şirket bilgisi oluşturulamadı veya bulunamadı.");
    }

    return company;
  }

  /**
   * Find company by NIP
   */
  static async findCompanyByNip(nip: string): Promise<CompanyInfo | null> {
    const company = await db.query.companies.findFirst({
      where: eq(companies.nip, nip),
    });

    return company || null;
  }

  /**
   * Create new company
   */
  static async createCompany(nip: string, companyName: string): Promise<CompanyInfo> {
    const [newCompany] = await db
      .insert(companies)
      .values({
        name: companyName,
        nip: nip,
      })
      .returning();

    if (!newCompany) {
      throw new Error("Şirket oluşturulamadı.");
    }

    return newCompany;
  }

  /**
   * Update company information
   */
  static async updateCompany(
    companyId: string, 
    updates: Partial<{ name: string; nip: string }>
  ): Promise<void> {
    await db
      .update(companies)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(companies.id, companyId));
  }
}