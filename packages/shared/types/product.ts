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

export interface ProductContextType {
  products: Product[];
  filteredProducts: Product[];
  categories: Category[];
  loadingProducts: boolean;
  loadingCategories: boolean;
  selectedCategory: string | null;
  searchQuery: string;
  hasMoreProducts: boolean;
  error: string | null;
  setSelectedCategory: (slug: string | null) => void;
  setSearchQuery: (query: string) => void;
  fetchProducts: (categorySlug?: string | null) => void;
  refreshProducts: (categorySlug?: string | null) => void;
  fetchMoreProducts: () => void;
  fetchCategories: () => void;
}
