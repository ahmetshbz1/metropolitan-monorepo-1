//  "find-company-by-id.ts"
//  metropolitan backend
//  Created by Ahmet on 08.07.2025.

import { eq } from "drizzle-orm";
import { db } from "../src/shared/infrastructure/database/connection";
import { companies } from "../src/shared/infrastructure/database/schema";

const companyId = process.argv[2];

if (!companyId) {
  console.error("❌ Please provide a company ID as an argument.");
  process.exit(1);
}

console.log(`🔎 Searching for company with ID: ${companyId}`);

try {
  const company = await db.query.companies.findFirst({
    where: eq(companies.id, companyId),
  });

  if (!company) {
    console.log("❓ Company not found.");
  } else {
    console.log("✅ Company found:");
    console.table([
      {
        id: company.id,
        name: company.name,
        nip: company.nip,
        createdAt: company.createdAt,
      },
    ]);
  }
} catch (error) {
  console.error("Error fetching company:", error);
}

process.exit(0);
