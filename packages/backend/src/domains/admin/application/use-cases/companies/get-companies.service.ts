import { desc } from "drizzle-orm";

import { db } from "../../../../../shared/infrastructure/database/connection";
import { companies } from "../../../../../shared/infrastructure/database/schema";

export interface Company {
  id: string;
  name: string;
  nip: string;
  createdAt: Date;
  updatedAt: Date;
}

export class GetCompaniesService {
  static async execute(): Promise<Company[]> {
    try {
      const companiesData = await db
        .select({
          id: companies.id,
          name: companies.name,
          nip: companies.nip,
          createdAt: companies.createdAt,
          updatedAt: companies.updatedAt,
        })
        .from(companies)
        .orderBy(desc(companies.createdAt));

      return companiesData;
    } catch (error) {
      console.error("GetCompaniesService error:", error);
      throw error;
    }
  }
}
