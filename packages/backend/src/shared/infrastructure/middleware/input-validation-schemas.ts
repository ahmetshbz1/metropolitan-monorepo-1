import { t } from 'elysia';

/**
 * Common validation schemas
 * Tüm ortak validasyon şemaları burada tanımlanır
 */
export const validationSchemas = {
  // User schemas
  email: t.String({
    format: 'email',
    minLength: 5,
    maxLength: 254,
    error: 'Geçersiz email adresi',
  }),

  phone: t.String({
    pattern: '^(\\+90|0)?[1-9]\\d{9}$',
    error: 'Geçersiz telefon numarası',
  }),

  password: t.String({
    minLength: 8,
    maxLength: 128,
    error: 'Şifre en az 8 karakter olmalıdır',
  }),

  username: t.String({
    pattern: '^[a-zA-Z0-9_-]{3,20}$',
    error: 'Kullanıcı adı 3-20 karakter arasında olmalı ve sadece harf, rakam, tire ve alt çizgi içerebilir',
  }),

  // Address schemas
  postalCode: t.String({
    pattern: '^\\d{5}$',
    error: 'Posta kodu 5 haneli olmalıdır',
  }),

  // Company schemas
  nip: t.String({
    pattern: '^\\d{10}$',
    error: 'Geçersiz NIP numarası',
  }),

  // Turkish ID
  tcKimlik: t.String({
    pattern: '^\\d{11}$',
    error: 'Geçersiz TC Kimlik Numarası',
  }),

  // UUID
  uuid: t.String({
    format: 'uuid',
    error: 'Geçersiz UUID formatı',
  }),

  // Common string validations
  shortText: t.String({
    minLength: 1,
    maxLength: 100,
  }),

  mediumText: t.String({
    minLength: 1,
    maxLength: 500,
  }),

  longText: t.String({
    minLength: 1,
    maxLength: 5000,
  }),

  // Numeric validations
  positiveInteger: t.Number({
    minimum: 1,
    error: 'Pozitif tam sayı olmalıdır',
  }),

  price: t.Number({
    minimum: 0,
    multipleOf: 0.01,
    error: 'Geçersiz fiyat formatı',
  }),

  quantity: t.Number({
    minimum: 1,
    maximum: 9999,
    error: 'Miktar 1-9999 arasında olmalıdır',
  }),

  // Date validations
  date: t.String({
    format: 'date-time',
    error: 'Geçersiz tarih formatı',
  }),

  // URL validation
  url: t.String({
    format: 'uri',
    error: 'Geçersiz URL formatı',
  }),
};

/**
 * Route-specific validation schemas
 * Route bazlı özel validasyon şemaları
 */
export const routeValidations = {
  // Auth routes
  register: t.Object({
    phone: validationSchemas.phone,
    firstName: validationSchemas.shortText,
    lastName: validationSchemas.shortText,
    userType: t.Union([t.Literal('individual'), t.Literal('corporate')]),
  }),

  login: t.Object({
    phone: validationSchemas.phone,
  }),

  verifyOtp: t.Object({
    phone: validationSchemas.phone,
    otp: t.String({ minLength: 6, maxLength: 6 }),
  }),

  // User routes
  updateProfile: t.Object({
    firstName: t.Optional(validationSchemas.shortText),
    lastName: t.Optional(validationSchemas.shortText),
    email: t.Optional(validationSchemas.email),
  }),

  // Address routes
  createAddress: t.Object({
    title: validationSchemas.shortText,
    firstName: validationSchemas.shortText,
    lastName: validationSchemas.shortText,
    phone: validationSchemas.phone,
    address: validationSchemas.mediumText,
    city: validationSchemas.shortText,
    district: validationSchemas.shortText,
    postalCode: validationSchemas.postalCode,
  }),

  // Order routes
  createOrder: t.Object({
    addressId: validationSchemas.uuid,
    paymentMethod: t.Union([
      t.Literal('credit_card'),
      t.Literal('bank_transfer'),
      t.Literal('cash_on_delivery'),
    ]),
    note: t.Optional(validationSchemas.mediumText),
  }),

  // Product routes
  searchProducts: t.Object({
    query: t.Optional(validationSchemas.shortText),
    categoryId: t.Optional(validationSchemas.uuid),
    minPrice: t.Optional(validationSchemas.price),
    maxPrice: t.Optional(validationSchemas.price),
    page: t.Optional(validationSchemas.positiveInteger),
    limit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
  }),

  // Cart routes
  addToCart: t.Object({
    productId: validationSchemas.uuid,
    quantity: validationSchemas.quantity,
  }),

  updateCartItem: t.Object({
    quantity: validationSchemas.quantity,
  }),
};
