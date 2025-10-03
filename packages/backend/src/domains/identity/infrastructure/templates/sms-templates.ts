//  "sms-templates.ts"
//  metropolitan backend
//  Multi-language SMS templates for OTP messages

export type SmsLanguage = 'tr' | 'en' | 'pl';
export type SmsAction = 'register' | 'login' | 'delete_account' | 'change_phone';

interface SmsTemplate {
  [key in SmsAction]: string;
}

interface SmsTemplates {
  [key in SmsLanguage]: SmsTemplate;
}

/**
 * Professional SMS templates in Turkish, English, and Polish
 * Each message includes the company name and specific action context
 */
export const SMS_TEMPLATES: SmsTemplates = {
  tr: {
    register: 'Metropolitan\'a hoş geldiniz! Kayıt işlemini tamamlamak için doğrulama kodunuz: {code}.',
    login: 'Metropolitan hesabınıza giriş yapmak için doğrulama kodunuz: {code}. Bu işlemi siz yapmadıysanız lütfen bizi bilgilendirin.',
    delete_account: 'Metropolitan hesap silme işleminizi onaylamak için doğrulama kodunuz: {code}. Bu işlem geri alınamaz.',
    change_phone: 'Metropolitan hesabınızda telefon numarası değişikliği için doğrulama kodunuz: {code}. Güvenliğiniz için bu kodu kimseyle paylaşmayın.'
  },
  en: {
    register: 'Welcome to Metropolitan! Your verification code to complete registration is: {code}.',
    login: 'Your Metropolitan login verification code is: {code}. If you didn\'t request this, please contact us immediately.',
    delete_account: 'Your Metropolitan account deletion verification code is: {code}. This action cannot be undone.',
    change_phone: 'Your Metropolitan phone number change verification code is: {code}. For your security, don\'t share this code with anyone.'
  },
  pl: {
    register: 'Witamy w Metropolitan! Twój kod weryfikacyjny do zakończenia rejestracji to: {code}.',
    login: 'Twój kod weryfikacyjny do logowania Metropolitan to: {code}. Jeśli to nie Ty, skontaktuj się z nami natychmiast.',
    delete_account: 'Twój kod weryfikacyjny do usunięcia konta Metropolitan to: {code}. Ta operacja jest nieodwracalna.',
    change_phone: 'Twój kod weryfikacyjny do zmiany numeru telefonu Metropolitan to: {code}. Dla bezpieczeństwa nie udostępniaj tego kodu nikomu.'
  }
};

/**
 * Get SMS template for specific language and action
 * Falls back to English if language is not supported
 */
export function getSmsTemplate(
  language: string | undefined,
  action: SmsAction
): string {
  // Normalize language to lowercase
  const normalizedLang = (language?.toLowerCase() || 'en') as string;

  // Check if language is supported, fallback to English
  const lang: SmsLanguage = ['tr', 'en', 'pl'].includes(normalizedLang)
    ? normalizedLang as SmsLanguage
    : 'en';

  return SMS_TEMPLATES[lang][action];
}

/**
 * Format SMS message with OTP code
 */
export function formatSmsMessage(
  language: string | undefined,
  action: SmsAction,
  code: string
): string {
  const template = getSmsTemplate(language, action);
  return template.replace('{code}', code);
}

/**
 * Get language from Accept-Language header
 * Extracts the primary language code from headers like "en-US,en;q=0.9"
 */
export function getLanguageFromHeader(acceptLanguageHeader?: string): string {
  if (!acceptLanguageHeader) return 'en';

  // Extract the primary language code
  const primaryLang = acceptLanguageHeader.split(',')[0]?.split('-')[0]?.toLowerCase();

  // Map common language codes to our supported languages
  const languageMap: { [key: string]: SmsLanguage } = {
    'tr': 'tr',
    'en': 'en',
    'pl': 'pl',
    'pol': 'pl', // Alternative Polish code
    'tur': 'tr', // Alternative Turkish code
    'eng': 'en', // Alternative English code
  };

  return languageMap[primaryLang] || 'en';
}