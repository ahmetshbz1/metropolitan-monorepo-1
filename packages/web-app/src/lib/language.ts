export const detectBrowserLanguage = (): string => {
  // Get stored language first
  const storedLanguage = localStorage.getItem("language");
  if (storedLanguage) {
    return storedLanguage;
  }

  // Detect browser language
  const browserLang = navigator.language || (navigator as any).userLanguage;

  // Get the first two characters (language code)
  const langCode = browserLang?.toLowerCase().substring(0, 2);

  // Map browser language to our supported languages
  switch (langCode) {
    case 'pl':
      return 'pl'; // Polish
    case 'tr':
      return 'tr'; // Turkish
    case 'en':
      return 'en'; // English
    default:
      // Default to Polish for Poland market
      // You can check for other languages and default accordingly
      return 'pl';
  }
};

export const getSupportedLanguage = (): string => {
  const detected = detectBrowserLanguage();
  // Store the detected/selected language
  localStorage.setItem("language", detected);
  return detected;
};