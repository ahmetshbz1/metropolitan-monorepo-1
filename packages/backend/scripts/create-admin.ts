import { AdminPasswordService } from "../src/domains/admin/application/services/admin-password.service";
import { AdminUserRepository } from "../src/domains/admin/infrastructure/repositories/admin-user.repository";

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error("Kullanım: bun run scripts/create-admin.ts <email> <parola>");
    process.exit(1);
  }

  const repository = new AdminUserRepository();
  const passwordService = new AdminPasswordService();

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await repository.findByEmail(normalizedEmail);
  if (existing) {
    console.log("Admin kullanıcısı zaten mevcut");
    process.exit(0);
  }

  const passwordHash = await passwordService.hash(password);
  await repository.create({
    email: normalizedEmail,
    passwordHash,
    isActive: true,
  });

  console.log("Admin kullanıcısı oluşturuldu");
}

main().catch((error) => {
  console.error("Admin oluşturma hatası", error);
  process.exit(1);
});
