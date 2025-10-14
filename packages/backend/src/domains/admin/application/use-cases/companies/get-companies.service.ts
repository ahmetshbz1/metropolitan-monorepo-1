import { desc } from "drizzle-orm";

import { db } from "../../../../../shared/infrastructure/database/connection";
import { companies } from "../../../../../shared/infrastructure/database/schema";
import { logger } from "../../../../../shared/infrastructure/monitoring/logger.config";

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
      logger.error({ error, context: "GetCompaniesService" }, "GetCompaniesService error");
      throw error;
    }
  }
}
