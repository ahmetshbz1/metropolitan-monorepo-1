import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

console.log("👤 Creating admin users...");

const ADMIN_USERS = [
  {
    email: "ahmet@metropolitanfg.pl",
    password: "Admin123!",
    role: "Super Admin",
  },
  {
    email: "manager@metropolitanfg.pl",
    password: "Manager123!",
    role: "Manager",
  },
  {
    email: "orders@metropolitanfg.pl",
    password: "Orders123!",
    role: "Orders Manager",
  },
  {
    email: "support@metropolitanfg.pl",
    password: "Support123!",
    role: "Support",
  },
];

const hashPassword = async (password: string): Promise<string> => {
  const hashedPassword = await Bun.password.hash(password, {
    algorithm: "bcrypt",
    cost: 10,
  });
  return hashedPassword;
};

const main = async () => {
  try {
    const client = postgres({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      database: process.env.POSTGRES_DB,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      max: 1,
    });

    const db = drizzle(client, { schema });

    console.log("🗑️  Deleting existing admin users...");
    await db.delete(schema.adminUsers);

    console.log("👥 Creating admin users...");
    for (const admin of ADMIN_USERS) {
      const passwordHash = await hashPassword(admin.password);

      await db.insert(schema.adminUsers).values({
        email: admin.email,
        passwordHash: passwordHash,
        isActive: true,
        failedAttemptCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`✅ Created: ${admin.email} (${admin.role})`);
    }

    console.log("\n📝 Admin Credentials:");
    console.log("━".repeat(60));
    for (const admin of ADMIN_USERS) {
      console.log(`${admin.role.padEnd(20)} | ${admin.email}`);
      console.log(`${"Password".padEnd(20)} | ${admin.password}`);
      console.log("─".repeat(60));
    }

    console.log("✅ Admin users created successfully!");
    await client.end();
  } catch (error) {
    console.error("❌ Error creating admin users:", error);
    process.exit(1);
  }
};

if (require.main === module) {
  main();
}

export { main as seedAdmins };
