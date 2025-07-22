//  "favorites.test.ts"
//  metropolitan backend
//  Created by Ahmet on 20.06.2025.

import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "bun:test";
import { eq } from "drizzle-orm";
import { sign } from "jsonwebtoken";
import { app } from "../..";
import { db } from "../db/connection";
import { favorites, users } from "../db/schema";
import { seedDatabase } from "../db/seed";

describe("Favorites API", () => {
  let authToken: string;
  let userId: string;
  let productId: string;
  const testPhoneNumber = "+909999999999";

  beforeAll(async () => {
    await seedDatabase();

    // 2. Test kullanıcısı oluştur
    const newUserResult = await db
      .insert(users)
      .values({
        phoneNumber: testPhoneNumber,
        firstName: "Test",
        lastName: "User",
        email: "test.user.fav@example.com",
      })
      .returning({ id: users.id });

    userId = newUserResult[0]!.id;

    // 3. Manuel JWT token imzala
    const secret = process.env.JWT_SECRET!;
    authToken = sign({ userId }, secret);

    // 4. Testlerde kullanmak için ürün al
    const productsResponse = await app.handle(
      new Request("http://localhost/api/products")
    );
    const productsBody = (await productsResponse.json()) as {
      success: boolean;
      data: any[];
    };
    productId = productsBody.data[0]!.id;
  });

  afterAll(async () => {
    // Oluşturulan kullanıcıyı temizle
    await db.delete(users).where(eq(users.id, userId));
  });

  // Her testten önce favoriler tablosunu temizle (izolasyon için)
  beforeEach(async () => {
    await db.delete(favorites).where(eq(favorites.userId, userId));
  });

  it("should add a product to favorites", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/me/favorites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ productId }),
      })
    );
    expect(response.status).toBe(200);
  });

  it("should not add a duplicate product to favorites", async () => {
    // Bir kez ekle
    await app.handle(
      new Request("http://localhost/api/users/me/favorites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ productId }),
      })
    );

    // Tekrar eklemeye çalış
    const response = await app.handle(
      new Request("http://localhost/api/users/me/favorites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ productId }),
      })
    );
    expect(response.status).toBe(409);
  });

  it("should list favorite products", async () => {
    await app.handle(
      new Request("http://localhost/api/users/me/favorites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ productId }),
      })
    );

    const response = await app.handle(
      new Request("http://localhost/api/users/me/favorites", {
        headers: { Authorization: `Bearer ${authToken}` },
      })
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { success: boolean; data: any[] };
    expect(body.data.length).toBe(1);
    expect(body.data[0]!.id).toBe(productId);
  });

  it("should remove a product from favorites", async () => {
    await app.handle(
      new Request("http://localhost/api/users/me/favorites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ productId }),
      })
    );

    const response = await app.handle(
      new Request(`http://localhost/api/users/me/favorites/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      })
    );
    expect(response.status).toBe(200);

    const listResponse = await app.handle(
      new Request("http://localhost/api/users/me/favorites", {
        headers: { Authorization: `Bearer ${authToken}` },
      })
    );
    const listBody = (await listResponse.json()) as {
      success: boolean;
      data: any[];
    };
    expect(listBody.data.length).toBe(0);
  });
});
