import { describe, expect, it } from "bun:test";

import { AdminPasswordService } from "../application/services/admin-password.service";

describe("AdminPasswordService", () => {
  const service = new AdminPasswordService();

  it("uretildigi parolayi dogrulamali", async () => {
    const password = "GucluParola123!";
    const hash = await service.hash(password);

    const result = await service.verify(password, hash);

    expect(result).toBe(true);
  });

  it("hatali parolayi reddetmeli", async () => {
    const password = "GucluParola123!";
    const hash = await service.hash(password);

    const result = await service.verify("YanlisParola789?", hash);

    expect(result).toBe(false);
  });

  it("kisa parola icin hata firlatmali", async () => {
    await expect(service.hash("kisaParola"))
      .rejects.toThrow("Parola uzunluğu minimum 12 karakter olmalıdır");
  });
});
