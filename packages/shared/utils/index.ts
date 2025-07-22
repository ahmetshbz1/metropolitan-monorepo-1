// Ortak utility fonksiyonları

// Para formatı
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(price);
};

// Tarih formatı
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat("tr-TR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

// Email validasyonu
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Telefon validasyonu (TR)
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^(\+90|0)?[1-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ""));
};

// Slug oluşturma
export const createSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
};
