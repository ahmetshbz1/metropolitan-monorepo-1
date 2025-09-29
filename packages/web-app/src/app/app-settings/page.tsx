"use client";

import { Button } from "@/components/ui/button";
import { Moon, Sun, Monitor, Globe } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";

export default function AppSettingsPage() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const themes = [
    { value: "system", icon: Monitor, label: t("app_settings.theme_system") },
    { value: "light", icon: Sun, label: t("app_settings.theme_light") },
    { value: "dark", icon: Moon, label: t("app_settings.theme_dark") },
  ];

  const languages = [
    { value: "tr", label: t("dropdown.turkish") },
    { value: "en", label: t("dropdown.english") },
    { value: "pl", label: t("dropdown.polish") },
  ];

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">{t("app_settings.title")}</h1>

        {/* Appearance Section */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase mb-3 px-2">
            {t("app_settings.appearance")}
          </h2>
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="mb-6">
              <h3 className="font-semibold mb-2">{t("app_settings.theme")}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t("app_settings.theme_desc")}
              </p>
              <div className="grid grid-cols-3 gap-3">
                {themes.map((themeOption) => (
                  <button
                    key={themeOption.value}
                    onClick={() => setTheme(themeOption.value)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                      theme === themeOption.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <themeOption.icon className="h-6 w-6" />
                    <span className="text-sm font-medium">
                      {themeOption.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Language Section */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase mb-3 px-2">
            {t("app_settings.language")}
          </h2>
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-start gap-3 mb-4">
              <Globe className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">
                  {t("app_settings.language")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("app_settings.language_desc")}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {languages.map((lang) => (
                <Button
                  key={lang.value}
                  variant={i18n.language === lang.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => i18n.changeLanguage(lang.value)}
                >
                  {lang.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="bg-muted/50 rounded-xl p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Daha fazla ayar seçeneği yakında eklenecek
          </p>
        </div>
      </div>
    </div>
  );
}
