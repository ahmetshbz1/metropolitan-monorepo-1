import enTranslations from "../../locales/en.json";
import plTranslations from "../../locales/pl.json";
import trTranslations from "../../locales/tr.json";

type Language = "tr" | "en" | "pl";

const translations = {
  tr: trTranslations.auth,
  en: enTranslations.auth,
  pl: plTranslations.auth,
};

export function getRateLimitMessage(waitTime: number, language?: string): string {
  const lang = (language && ["tr", "en", "pl"].includes(language) ? language : "en") as Language;
  return translations[lang].rate_limit.replace("{waitTime}", waitTime.toString());
}
