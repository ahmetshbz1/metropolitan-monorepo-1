"use client";

// "CookieSettingsDialog.tsx"
// metropolitan web-app
// Detailed cookie settings dialog with GDPR compliance

import { useCookieConsentStore } from "@/stores/cookie-consent-store";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import {
  Shield,
  BarChart3,
  Megaphone,
  Settings,
  Info,
  ExternalLink,
} from "lucide-react";

interface CookieSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CookieSettingsDialog({
  open,
  onOpenChange,
}: CookieSettingsDialogProps) {
  const { t, i18n } = useTranslation();
  const { preferences, updatePreferences, acceptAll, rejectAll } =
    useCookieConsentStore();

  // i18n.language "tr-TR" formatında geliyor, sadece ilk 2 karakteri al
  const language = ((i18n.language || "tr").split("-")[0]) as "tr" | "en" | "pl";

  // Local state for temporary changes before saving
  const [tempPreferences, setTempPreferences] = useState(preferences);

  // Update local state when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setTempPreferences(preferences);
    }
    onOpenChange(isOpen);
  };

  // Save preferences and close dialog
  const handleSave = () => {
    updatePreferences(tempPreferences);
    onOpenChange(false);
  };

  // Accept all and close
  const handleAcceptAll = () => {
    acceptAll();
    onOpenChange(false);
  };

  // Reject all and close
  const handleRejectAll = () => {
    rejectAll();
    onOpenChange(false);
  };

  const cookieCategories = [
    {
      id: "essential" as const,
      icon: Shield,
      title: t("cookie.settings.essential.title"),
      description: t("cookie.settings.essential.description"),
      required: true,
      color: "text-green-600 dark:text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950/30",
    },
    {
      id: "analytics" as const,
      icon: BarChart3,
      title: t("cookie.settings.analytics.title"),
      description: t("cookie.settings.analytics.description"),
      required: false,
      color: "text-blue-600 dark:text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      id: "marketing" as const,
      icon: Megaphone,
      title: t("cookie.settings.marketing.title"),
      description: t("cookie.settings.marketing.description"),
      required: false,
      color: "text-purple-600 dark:text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
    },
    {
      id: "preferences" as const,
      icon: Settings,
      title: t("cookie.settings.preferences.title"),
      description: t("cookie.settings.preferences.description"),
      required: false,
      color: "text-orange-600 dark:text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-950/30",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <span className="text-2xl">🍪</span>
            {t("cookie.settings.title")}
          </DialogTitle>
          <DialogDescription className="text-base">
            {t("cookie.settings.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Cookie Policy Link */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  {t("cookie.settings.info_text")}
                </p>
                <a
                  href={`/cookie-policy?lang=${language}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {t("cookie.settings.read_policy")}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Cookie Categories */}
          <div className="space-y-4">
            {cookieCategories.map((category) => {
              const Icon = category.icon;
              return (
                <div
                  key={category.id}
                  className="rounded-xl border border-border/50 p-5 transition-colors hover:border-border"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${category.bgColor} flex-shrink-0`}
                    >
                      <Icon className={`h-6 w-6 ${category.color}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-semibold flex items-center gap-2">
                            {category.title}
                            {category.required && (
                              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950/50 dark:text-green-400">
                                {t("cookie.settings.required")}
                              </span>
                            )}
                          </h4>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {category.description}
                          </p>
                        </div>

                        {/* Switch */}
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={category.id}
                            checked={tempPreferences[category.id]}
                            onCheckedChange={(checked) =>
                              setTempPreferences((prev) => ({
                                ...prev,
                                [category.id]: checked,
                              }))
                            }
                            disabled={category.required}
                          />
                          <Label htmlFor={category.id} className="sr-only">
                            {category.title}
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row-reverse">
            <Button onClick={handleSave} size="lg" className="sm:flex-1">
              {t("cookie.settings.save_preferences")}
            </Button>
            <Button
              onClick={handleAcceptAll}
              variant="outline"
              size="lg"
              className="sm:flex-1"
            >
              {t("cookie.banner.accept_all")}
            </Button>
            <Button
              onClick={handleRejectAll}
              variant="ghost"
              size="lg"
              className="sm:flex-1"
            >
              {t("cookie.banner.reject_all")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
