//  "validation.ts"
//  metropolitan app
//  Created by Ahmet on 23.06.2025.

export function isValidEmail(email: string): boolean {
  // En az bir karakter, @, en az bir karakter, nokta, en az iki harfli TLD ve sonu harf ile bitmeli
  // TLD sadece harflerden oluşmalı ve minimum 2 karakter olmalı (RFC standartlarına uygun)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
}
