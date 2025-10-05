/**
 * Enhanced validation utilities for input sanitization and security
 */

// XSS Prevention - HTML entity encoding
export const escapeHtml = (str: string): string => {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
  };

  return String(str).replace(/[&<>"'\/]/g, (char) => htmlEntities[char] || char);
};

// SQL Injection Prevention - Parameterized query validation
export const sanitizeSqlInput = (input: string): string => {
  // Remove or escape dangerous SQL keywords and special characters
  const dangerousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|CREATE|ALTER|EXEC|EXECUTE|SCRIPT|JAVASCRIPT|TRUNCATE)\b)/gi,
    /(--|#|\/\*|\*\/|;|'|"|`|\\x00|\\n|\\r|\\x1a)/g
  ];

  let sanitized = input;
  dangerousPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  return sanitized.trim();
};

// NoSQL Injection Prevention (for MongoDB, etc.)
export const sanitizeNoSqlInput = (input: any): any => {
  if (typeof input === 'string') {
    // Remove MongoDB operators
    return input.replace(/[$]/g, '');
  }

  if (typeof input === 'object' && input !== null) {
    const sanitized: any = Array.isArray(input) ? [] : {};

    for (const key in input) {
      if (input.hasOwnProperty(key)) {
        // Remove keys starting with $ (MongoDB operators)
        if (!key.startsWith('$')) {
          sanitized[key] = sanitizeNoSqlInput(input[key]);
        }
      }
    }

    return sanitized;
  }

  return input;
};

// Path Traversal Prevention
export const sanitizePath = (path: string): string => {
  // Remove path traversal attempts
  return path
    .replace(/\.\./g, '')
    .replace(/[\\\/]+/g, '/')
    .replace(/^\/+/, '');
};

// Command Injection Prevention
export const sanitizeShellArg = (arg: string): string => {
  // Remove shell metacharacters
  return arg.replace(/[;&|`$<>\\!]/g, '');
};

// Email Validation (Enhanced)
export const validateEmail = (email: string): boolean => {
  // More comprehensive email regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  // Additional checks
  if (!emailRegex.test(email)) return false;
  if (email.length > 254) return false; // RFC 5321
  if (email.split('@')[0].length > 64) return false; // Local part limit

  return true;
};

// Phone Validation (Turkish + International)
export const validatePhone = (phone: string, countryCode: string = 'TR'): boolean => {
  const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');

  const phonePatterns: Record<string, RegExp> = {
    'TR': /^(\+90|0)?[1-9]\d{9}$/,
    'US': /^(\+1)?[2-9]\d{2}[2-9]\d{6}$/,
    'UK': /^(\+44|0)?[1-9]\d{9,10}$/,
    'PL': /^(\+48)?[4-9]\d{8}$/,
    'DEFAULT': /^\+?\d{7,15}$/
  };

  const pattern = phonePatterns[countryCode] || phonePatterns['DEFAULT'];
  return pattern.test(cleanPhone);
};

// URL Validation
export const validateUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    // Only allow http and https protocols
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};

// Credit Card Validation (Luhn Algorithm)
export const validateCreditCard = (cardNumber: string): boolean => {
  const cleanNumber = cardNumber.replace(/\D/g, '');

  if (cleanNumber.length < 13 || cleanNumber.length > 19) {
    return false;
  }

  // Luhn algorithm
  let sum = 0;
  let isEven = false;

  for (let i = cleanNumber.length - 1; i >= 0; i--) {
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

// Polish NIP (Tax Number) Validation
export const validateNIP = (nip: string): boolean => {
  const cleanNip = nip.replace(/[\s\-]/g, '');

  if (!/^\d{10}$/.test(cleanNip)) {
    return false;
  }

  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  let sum = 0;

  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanNip[i], 10) * weights[i];
  }

  const checksum = sum % 11;
  const lastDigit = parseInt(cleanNip[9], 10);

  return checksum === lastDigit;
};

// Turkish TC Kimlik No Validation
export const validateTCKimlik = (tcno: string): boolean => {
  if (!/^\d{11}$/.test(tcno)) return false;
  if (tcno[0] === '0') return false;

  const digits = tcno.split('').map(Number);

  // Calculate 10th digit
  const sumOdd = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const sumEven = digits[1] + digits[3] + digits[5] + digits[7];
  const digit10 = ((sumOdd * 7) - sumEven) % 10;

  if (digit10 !== digits[9]) return false;

  // Calculate 11th digit
  const sumFirst10 = digits.slice(0, 10).reduce((a, b) => a + b, 0);
  const digit11 = sumFirst10 % 10;

  return digit11 === digits[10];
};

// Password Strength Validation
export const validatePassword = (password: string): {
  isValid: boolean;
  strength: 'weak' | 'moderate' | 'strong';
  issues: string[];
} => {
  const issues: string[] = [];
  let strength: 'weak' | 'moderate' | 'strong' = 'weak';

  // Minimum requirements
  if (password.length < 8) issues.push('En az 8 karakter olmalı');
  if (!/[a-z]/.test(password)) issues.push('Küçük harf içermeli');
  if (!/[A-Z]/.test(password)) issues.push('Büyük harf içermeli');
  if (!/\d/.test(password)) issues.push('Rakam içermeli');
  if (!/[^a-zA-Z0-9]/.test(password)) issues.push('Özel karakter içermeli');

  // Strength calculation
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 2) strength = 'weak';
  else if (score <= 4) strength = 'moderate';
  else strength = 'strong';

  return {
    isValid: issues.length === 0,
    strength,
    issues
  };
};

// Username Validation
export const validateUsername = (username: string): boolean => {
  // Allow alphanumeric, underscore, hyphen, 3-20 characters
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  return usernameRegex.test(username);
};

// Postal Code Validation
export const validatePostalCode = (code: string, country: string = 'TR'): boolean => {
  const postalPatterns: Record<string, RegExp> = {
    'TR': /^\d{5}$/,
    'US': /^\d{5}(-\d{4})?$/,
    'UK': /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i,
    'PL': /^\d{2}-\d{3}$/,
  };

  const pattern = postalPatterns[country];
  return pattern ? pattern.test(code) : false;
};

// IBAN Validation (Basic)
export const validateIBAN = (iban: string): boolean => {
  const cleanIban = iban.replace(/\s/g, '').toUpperCase();

  // Basic length check (varies by country)
  if (cleanIban.length < 15 || cleanIban.length > 34) return false;

  // Country code and check digits
  if (!/^[A-Z]{2}\d{2}/.test(cleanIban)) return false;

  // Move first 4 chars to end
  const rearranged = cleanIban.slice(4) + cleanIban.slice(0, 4);

  // Convert letters to numbers (A=10, B=11, etc.)
  const numericIban = rearranged.replace(/[A-Z]/g, (char) =>
    (char.charCodeAt(0) - 55).toString()
  );

  // Mod 97 check
  let remainder = Number.parseInt(numericIban.slice(0, 9), 10) % 97;
  for (let i = 9; i < numericIban.length; i += 7) {
    const block = `${remainder}${numericIban.slice(i, i + 7)}`;
    remainder = Number.parseInt(block, 10) % 97;
  }

  return remainder === 1;
};

// File Extension Validation
export const validateFileExtension = (
  filename: string,
  allowedExtensions: string[]
): boolean => {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext ? allowedExtensions.includes(ext) : false;
};

// File Size Validation
export const validateFileSize = (
  sizeInBytes: number,
  maxSizeInMB: number
): boolean => {
  return sizeInBytes <= maxSizeInMB * 1024 * 1024;
};

// Input Length Validation with Unicode Support
export const validateLength = (
  input: string,
  min: number,
  max: number
): boolean => {
  // Use Array.from for proper Unicode character counting
  const length = Array.from(input).length;
  return length >= min && length <= max;
};

// Profanity Filter (Basic)
export const containsProfanity = (text: string): boolean => {
  // Add actual profanity words based on your requirements
  const profanityList: string[] = [
    // Add words here
  ];

  const lowerText = text.toLowerCase();
  return profanityList.some(word => lowerText.includes(word));
};

// JSON Validation
export const isValidJSON = (str: string): boolean => {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};

// UUID Validation
export const validateUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Date Range Validation
export const validateDateRange = (
  startDate: Date,
  endDate: Date,
  maxRangeDays?: number
): boolean => {
  if (startDate > endDate) return false;

  if (maxRangeDays) {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= maxRangeDays;
  }

  return true;
};

// Export all validators as a single object for convenience
export const validators = {
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
  validateDateRange,
};
