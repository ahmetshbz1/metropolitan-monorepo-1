import type { SupportedLanguage } from "./types";

export const SUPPORTED_LANGUAGES: Array<{
  code: SupportedLanguage;
  label: string;
}> = [
  { code: "tr", label: "Türkçe" },
  { code: "en", label: "English" },
  { code: "pl", label: "Polski" },
];
