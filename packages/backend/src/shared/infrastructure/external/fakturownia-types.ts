// fakturownia-types.ts
// Type definitions for Fakturownia API integration
// Polish invoice system data structures

export interface FakturowniaInvoiceItem {
  name: string;
  code?: string; // Ürün kodu (kullanılmıyor - product_id tercih edilmeli)
  product_id?: number; // Fakturownia product ID - mevcut ürünü kullanmak için
  tax: number;
  total_price_gross: number;
  quantity: number;
  kind?: string;
}

export interface FakturowniaInvoice {
  kind: "vat" | "proforma";
  sell_date: string;
  buyer_name: string;
  buyer_street?: string;
  buyer_city?: string;
  buyer_post_code?: string;
  buyer_country?: string;
  buyer_tax_no?: string;
  buyer_email?: string;
  buyer_phone?: string;
  payment_type?: string;
  payment_to?: string;
  positions: FakturowniaInvoiceItem[];
}

export interface FakturowniaInvoiceResponse {
  id: number;
  token: string;
  number: string;
  sell_date: string;
  total_price_gross: string;
  status: string;
  buyer_name: string;
  positions: FakturowniaInvoiceItem[];
}

export interface FakturowniaClient {
  id?: number;
  name: string;
  street?: string;
  city?: string;
  post_code?: string;
  country?: string;
  tax_no?: string;
  email?: string;
  phone?: string;
}

export interface FakturowniaError {
  error: string;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface FakturowniaProduct {
  id: number;
  name: string;
  code?: string;
  tax: number;
  price_gross?: number;
  price_net?: number;
  quantity?: number;
  created_at?: string;
  updated_at?: string;
}

export interface FakturowniaProductsResponse {
  products: FakturowniaProduct[];
}