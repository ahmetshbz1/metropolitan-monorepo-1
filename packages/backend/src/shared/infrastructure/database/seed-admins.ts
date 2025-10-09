import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";
import * as schema from "./schema";

console.log("👤 Creating admin users...");

const scryptAsync = promisify(scrypt);

const ADMIN_USERS = [
  {
    email: "ahmet@metropolitanfg.pl",
    password: "7#mK9$xN2@pL5&vR",
    role: "Super Admin",
  },
  {
    email: "manager@metropolitanfg.pl",
    password: "4%wQ8*dF3#hJ6!zX",
    role: "Manager",
  },
  {
    email: "orders@metropolitanfg.pl",
    password: "9&bT5@nM2$gK7*cP",
    role: "Orders Manager",
  },
  {
    email: "support@metropolitanfg.pl",
    password: "3!vR6#xL8%fD4@sW",
    role: "Support",
  },
];

const hashPassword = async (password: string): Promise<string> => {
  const saltLength = 16;
  const keyLength = 64;
  const costFactor = 16384;
  const blockSize = 8;
  const parallelization = 1;
  const maxMemory = 32 * 1024 * 1024;

  const salt = randomBytes(saltLength);
  const derivedKey = (await scryptAsync(password, salt, keyLength, {
    N: costFactor,
    r: blockSize,
    p: parallelization,
    maxmem: maxMemory,
  })) as Buffer;

  return [
    "scrypt",
    costFactor.toString(10),
    blockSize.toString(10),
    parallelization.toString(10),
    salt.toString("base64"),
    derivedKey.toString("base64"),
  ].join(":");
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
