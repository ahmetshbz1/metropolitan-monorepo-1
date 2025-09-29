import api from '@/lib/api';
import type { Product, Category } from '@metropolitan/shared';

interface ProductsParams {
  lang?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface CategoriesParams {
  lang?: string;
}

export const productsApi = {
  getProducts: async (params: ProductsParams = {}) => {
    const response = await api.get('/products', { params });
    return response.data.data as Product[];
  },
  
  getProductById: async (id: string, lang?: string) => {
    const response = await api.get(`/products/${id}`, {
      params: { lang }
    });
    return response.data.data as Product;
  },
  
  getCategories: async (params: CategoriesParams = {}) => {
    const response = await api.get('/products/categories', { params });
    return response.data.data as Category[];
  },
  
  searchProducts: async (query: string, lang?: string) => {
    const response = await api.get('/products/search', {
      params: { q: query, lang }
    });
    return response.data.data as Product[];
  },
};
