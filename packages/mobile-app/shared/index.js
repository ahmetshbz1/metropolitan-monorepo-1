// ../../../../shared/constants/index.ts
var API_ENDPOINTS = {
  AUTH: "/auth",
  USERS: "/users",
  PRODUCTS: "/products",
  ORDERS: "/orders",
  CART: "/cart",
  FAVORITES: "/favorites",
  ADDRESSES: "/addresses",
  PAYMENTS: "/payments"
};
var ORDER_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled"
};
var PAYMENT_METHODS = {
  CREDIT_CARD: "credit_card",
  BANK_TRANSFER: "bank_transfer",
  CASH_ON_DELIVERY: "cash_on_delivery"
};
var ERROR_MESSAGES = {
  NETWORK_ERROR: "Bağlantı hatası oluştu",
  VALIDATION_ERROR: "Geçersiz veri",
  UNAUTHORIZED: "Yetkisiz erişim",
  NOT_FOUND: "Bulunamadı",
  SERVER_ERROR: "Sunucu hatası"
};
var SUCCESS_MESSAGES = {
  SAVED: "Başarıyla kaydedildi",
  UPDATED: "Başarıyla güncellendi",
  DELETED: "Başarıyla silindi",
  SENT: "Başarıyla gönderildi"
};
// ../../../../shared/types/checkout.ts
var PaymentType;
((PaymentType2) => {
  PaymentType2["CARD"] = "card";
  PaymentType2["APPLE_PAY"] = "apple_pay";
  PaymentType2["GOOGLE_PAY"] = "google_pay";
  PaymentType2["BLIK"] = "blik";
  PaymentType2["STRIPE"] = "stripe";
  PaymentType2["BANK_TRANSFER"] = "bank_transfer";
})(PaymentType ||= {});
// ../../../../shared/types/error.ts
function isAPIError(error) {
  return typeof error === "object" && error !== null && "message" in error && typeof error.message === "string";
}
function isStructuredError(error) {
  return error instanceof Error && (("key" in error) || ("code" in error) || ("params" in error));
}
var ErrorCode;
((ErrorCode2) => {
  ErrorCode2["AUTH_INVALID_CREDENTIALS"] = "AUTH_INVALID_CREDENTIALS";
  ErrorCode2["AUTH_TOKEN_EXPIRED"] = "AUTH_TOKEN_EXPIRED";
  ErrorCode2["AUTH_UNAUTHORIZED"] = "AUTH_UNAUTHORIZED";
  ErrorCode2["VALIDATION_ERROR"] = "VALIDATION_ERROR";
  ErrorCode2["INVALID_INPUT"] = "INVALID_INPUT";
  ErrorCode2["INSUFFICIENT_STOCK"] = "INSUFFICIENT_STOCK";
  ErrorCode2["ORDER_NOT_FOUND"] = "ORDER_NOT_FOUND";
  ErrorCode2["PAYMENT_FAILED"] = "PAYMENT_FAILED";
  ErrorCode2["NETWORK_ERROR"] = "NETWORK_ERROR";
  ErrorCode2["TIMEOUT"] = "TIMEOUT";
  ErrorCode2["INTERNAL_SERVER_ERROR"] = "INTERNAL_SERVER_ERROR";
  ErrorCode2["SERVICE_UNAVAILABLE"] = "SERVICE_UNAVAILABLE";
})(ErrorCode ||= {});
// ../../../../shared/types/settings.ts
var DEFAULT_USER_SETTINGS = {
  theme: "system",
  mobile: {
    hapticsEnabled: true,
    notificationsEnabled: true,
    notificationSoundsEnabled: true
  },
  language: "tr",
  currency: "TRY",
  emailNotifications: {
    orderUpdates: true,
    promotions: false,
    newsletter: false
  }
};
// ../../../../shared/utils/validation.ts
var escapeHtml = (str) => {
  const htmlEntities = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
    "/": "&#x2F;"
  };
  return String(str).replace(/[&<>"'\/]/g, (char) => htmlEntities[char] || char);
};
var sanitizeSqlInput = (input) => {
  const dangerousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|CREATE|ALTER|EXEC|EXECUTE|SCRIPT|JAVASCRIPT|TRUNCATE)\b)/gi,
    /(--|#|\/\*|\*\/|;|'|"|`|\\x00|\\n|\\r|\\x1a)/g
  ];
  let sanitized = input;
  dangerousPatterns.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, "");
  });
  return sanitized.trim();
};
var sanitizeNoSqlInput = (input) => {
  if (typeof input === "string") {
    return input.replace(/[$]/g, "");
  }
  if (typeof input === "object" && input !== null) {
    const sanitized = Array.isArray(input) ? [] : {};
    for (const key in input) {
      if (input.hasOwnProperty(key)) {
        if (!key.startsWith("$")) {
          sanitized[key] = sanitizeNoSqlInput(input[key]);
        }
      }
    }
    return sanitized;
  }
  return input;
};
var sanitizePath = (path) => {
  return path.replace(/\.\./g, "").replace(/[\\\/]+/g, "/").replace(/^\/+/, "");
};
var sanitizeShellArg = (arg) => {
  return arg.replace(/[;&|`$<>\\!]/g, "");
};
var validateEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!emailRegex.test(email))
    return false;
  if (email.length > 254)
    return false;
  if (email.split("@")[0].length > 64)
    return false;
  return true;
};
var validatePhone = (phone, countryCode = "TR") => {
  const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, "");
  const phonePatterns = {
    TR: /^(\+90|0)?[1-9]\d{9}$/,
    US: /^(\+1)?[2-9]\d{2}[2-9]\d{6}$/,
    UK: /^(\+44|0)?[1-9]\d{9,10}$/,
    PL: /^(\+48)?[4-9]\d{8}$/,
    DEFAULT: /^\+?\d{7,15}$/
  };
  const pattern = phonePatterns[countryCode] || phonePatterns["DEFAULT"];
  return pattern.test(cleanPhone);
};
var validateUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return ["http:", "https:"].includes(urlObj.protocol);
  } catch {
    return false;
  }
};
var validateCreditCard = (cardNumber) => {
  const cleanNumber = cardNumber.replace(/\D/g, "");
  if (cleanNumber.length < 13 || cleanNumber.length > 19) {
    return false;
  }
  let sum = 0;
  let isEven = false;
  for (let i = cleanNumber.length - 1;i >= 0; i--) {
    let digit = parseInt(cleanNumber[i], 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
    isEven = !isEven;
  }
  return sum % 10 === 0;
};
var validateNIP = (nip) => {
  const cleanNip = nip.replace(/[\s\-]/g, "");
  if (!/^\d{10}$/.test(cleanNip)) {
    return false;
  }
  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  let sum = 0;
  for (let i = 0;i < 9; i++) {
    sum += parseInt(cleanNip[i], 10) * weights[i];
  }
  const checksum = sum % 11;
  const lastDigit = parseInt(cleanNip[9], 10);
  return checksum === lastDigit;
};
var validateTCKimlik = (tcno) => {
  if (!/^\d{11}$/.test(tcno))
    return false;
  if (tcno[0] === "0")
    return false;
  const digits = tcno.split("").map(Number);
  const sumOdd = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const sumEven = digits[1] + digits[3] + digits[5] + digits[7];
  const digit10 = (sumOdd * 7 - sumEven) % 10;
  if (digit10 !== digits[9])
    return false;
  const sumFirst10 = digits.slice(0, 10).reduce((a, b) => a + b, 0);
  const digit11 = sumFirst10 % 10;
  return digit11 === digits[10];
};
var validatePassword = (password) => {
  const issues = [];
  let strength = "weak";
  if (password.length < 8)
    issues.push("En az 8 karakter olmalı");
  if (!/[a-z]/.test(password))
    issues.push("Küçük harf içermeli");
  if (!/[A-Z]/.test(password))
    issues.push("Büyük harf içermeli");
  if (!/\d/.test(password))
    issues.push("Rakam içermeli");
  if (!/[^a-zA-Z0-9]/.test(password))
    issues.push("Özel karakter içermeli");
  let score = 0;
  if (password.length >= 8)
    score++;
  if (password.length >= 12)
    score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password))
    score++;
  if (/\d/.test(password))
    score++;
  if (/[^a-zA-Z0-9]/.test(password))
    score++;
  if (score <= 2)
    strength = "weak";
  else if (score <= 4)
    strength = "moderate";
  else
    strength = "strong";
  return {
    isValid: issues.length === 0,
    strength,
    issues
  };
};
var validateUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  return usernameRegex.test(username);
};
var validatePostalCode = (code, country = "TR") => {
  const postalPatterns = {
    TR: /^\d{5}$/,
    US: /^\d{5}(-\d{4})?$/,
    UK: /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i,
    PL: /^\d{2}-\d{3}$/
  };
  const pattern = postalPatterns[country];
  return pattern ? pattern.test(code) : false;
};
var validateIBAN = (iban) => {
  const cleanIban = iban.replace(/\s/g, "").toUpperCase();
  if (cleanIban.length < 15 || cleanIban.length > 34)
    return false;
  if (!/^[A-Z]{2}\d{2}/.test(cleanIban))
    return false;
  const rearranged = cleanIban.slice(4) + cleanIban.slice(0, 4);
  const numericIban = rearranged.replace(/[A-Z]/g, (char) => (char.charCodeAt(0) - 55).toString());
  let remainder = numericIban.slice(0, 9) % 97;
  for (let i = 9;i < numericIban.length; i += 7) {
    remainder = (remainder + numericIban.slice(i, i + 7)) % 97;
  }
  return remainder === 1;
};
var validateFileExtension = (filename, allowedExtensions) => {
  const ext = filename.split(".").pop()?.toLowerCase();
  return ext ? allowedExtensions.includes(ext) : false;
};
var validateFileSize = (sizeInBytes, maxSizeInMB) => {
  return sizeInBytes <= maxSizeInMB * 1024 * 1024;
};
var validateLength = (input, min, max) => {
  const length = Array.from(input).length;
  return length >= min && length <= max;
};
var containsProfanity = (text) => {
  const profanityList = [];
  const lowerText = text.toLowerCase();
  return profanityList.some((word) => lowerText.includes(word));
};
var isValidJSON = (str) => {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};
var validateUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};
var validateDateRange = (startDate, endDate, maxRangeDays) => {
  if (startDate > endDate)
    return false;
  if (maxRangeDays) {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= maxRangeDays;
  }
  return true;
};
var validators = {
  escapeHtml,
  sanitizeSqlInput,
  sanitizeNoSqlInput,
  sanitizePath,
  sanitizeShellArg,
  validateEmail,
  validatePhone,
  validateUrl,
  validateCreditCard,
  validateNIP,
  validateTCKimlik,
  validatePassword,
  validateUsername,
  validatePostalCode,
  validateIBAN,
  validateFileExtension,
  validateFileSize,
  validateLength,
  containsProfanity,
  isValidJSON,
  validateUUID,
  validateDateRange
};

// ../../../../shared/utils/index.ts
var formatPrice = (price) => {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY"
  }).format(price);
};
var formatDate = (date) => {
  return new Intl.DateTimeFormat("tr-TR", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(date);
};
var validateEmail2 = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
var validatePhone2 = (phone) => {
  const phoneRegex = /^(\+90|0)?[1-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ""));
};
var createSlug = (text) => {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
};
export {
  validators,
  validateUsername,
  validateUrl,
  validateUUID,
  validateTCKimlik,
  validatePostalCode,
  validatePhone2 as validatePhone,
  validatePassword,
  validateNIP,
  validateLength,
  validateIBAN,
  validateFileSize,
  validateFileExtension,
  validateEmail2 as validateEmail,
  validateDateRange,
  validateCreditCard,
  sanitizeSqlInput,
  sanitizeShellArg,
  sanitizePath,
  sanitizeNoSqlInput,
  isValidJSON,
  isStructuredError,
  isAPIError,
  formatPrice,
  formatDate,
  escapeHtml,
  createSlug,
  containsProfanity,
  SUCCESS_MESSAGES,
  PaymentType,
  PAYMENT_METHODS,
  ORDER_STATUS,
  ErrorCode,
  ERROR_MESSAGES,
  DEFAULT_USER_SETTINGS,
  API_ENDPOINTS
};
