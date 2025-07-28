//  "product.ts"
//  metropolitan app
//  Created by Ahmet on 15.07.2025.

export interface Product {
  id: string;
  name: string;
  image: string;
  price: number;
  stock: number;
  category: string;
  brand: string;
  size?: string;
  currency?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}
