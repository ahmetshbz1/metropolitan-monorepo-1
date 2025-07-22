// Ortak sabitler

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: "/auth",
  USERS: "/users",
  PRODUCTS: "/products",
  ORDERS: "/orders",
  CART: "/cart",
  FAVORITES: "/favorites",
  ADDRESSES: "/addresses",
  PAYMENTS: "/payments",
} as const;

// Order Status
export const ORDER_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
} as const;

// Payment Methods
export const PAYMENT_METHODS = {
  CREDIT_CARD: "credit_card",
  BANK_TRANSFER: "bank_transfer",
  CASH_ON_DELIVERY: "cash_on_delivery",
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Bağlantı hatası oluştu",
  VALIDATION_ERROR: "Geçersiz veri",
  UNAUTHORIZED: "Yetkisiz erişim",
  NOT_FOUND: "Bulunamadı",
  SERVER_ERROR: "Sunucu hatası",
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  SAVED: "Başarıyla kaydedildi",
  UPDATED: "Başarıyla güncellendi",
  DELETED: "Başarıyla silindi",
  SENT: "Başarıyla gönderildi",
} as const;
