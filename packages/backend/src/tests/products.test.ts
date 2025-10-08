//  "products.test.ts"
//  metropolitan backend
//  Created by Ahmet on 08.07.2025.

import { expect, test } from "bun:test";

import { app } from "../..";

interface ProductListItem {
  id: string;
  name: string;
  image: string | null;
  price: string;
  stock: number;
  category: string | null;
  brand: string | null;
}

interface ProductListResponse {
  success: boolean;
  data: ProductListItem[];
}

test("GET /api/products returns a list of products", async () => {
  const response = (await app
    .handle(new Request("http://localhost/api/products?lang=tr"))
    .then((res) => res.json())) as ProductListResponse;

  expect(response.success).toBe(true);
  expect(Array.isArray(response.data)).toBe(true);

  if (response.data.length > 0) {
    const firstProduct = response.data[0];
    expect(firstProduct).toHaveProperty("id");
    expect(firstProduct).toHaveProperty("name");
    expect(firstProduct).toHaveProperty("image");
    expect(firstProduct).toHaveProperty("price");
    expect(firstProduct).toHaveProperty("stock");
    expect(firstProduct).toHaveProperty("category");
    expect(firstProduct).toHaveProperty("brand");
  }
});
