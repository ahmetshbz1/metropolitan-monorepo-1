"use client";

// "CookieConsentBanner.tsx"
// metropolitan web-app
// Modern, minimalist cookie consent banner

import { useCookieConsentStore } from "@/stores/cookie-consent-store";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { X, Settings } from "lucide-react";
import { useState } from "react";
import { CookieSettingsDialog } from "./CookieSettingsDialog";
import { motion, AnimatePresence } from "framer-motion";

export function CookieConsentBanner() {
  const { t } = useTranslation();
  const { hasConsented, showBanner, acceptAll, rejectAll, closeBanner } =
    useCookieConsentStore();
  const [showSettings, setShowSettings] = useState(false);

  // Don't show banner if user has already consented
  if (hasConsented || !showBanner) {
    return null;
  }

  return (
    <>
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
          >
            <div className="mx-auto max-w-7xl">
              <div className="relative rounded-2xl border border-border/50 bg-background/95 p-6 shadow-2xl backdrop-blur-xl md:p-8">
                {/* Close button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeBanner}
                  className="absolute right-4 top-4 z-10"
                  aria-label={t("common.close")}
                >
                  <X className="h-5 w-5" />
                </Button>

                <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start lg:gap-8">
                  {/* Content */}
                  <div className="space-y-3 pr-12 lg:pr-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <span className="text-xl">🍪</span>
                      </div>
                      <h3 className="text-lg font-semibold">
                        {t("cookie.banner.title")}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t("cookie.banner.description")}
                    </p>
                    <button
                      onClick={() => setShowSettings(true)}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                      {t("cookie.banner.learn_more")}
                      <span aria-hidden="true">→</span>
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 lg:flex-col lg:gap-3 lg:min-w-[180px]">
                    <Button
                      onClick={acceptAll}
                      size="lg"
                      className="w-full font-semibold shadow-lg hover:shadow-xl transition-shadow"
                    >
                      {t("cookie.banner.accept_all")}
                    </Button>
                    <Button
                      onClick={rejectAll}
                      variant="outline"
                      size="lg"
                      className="w-full font-medium"
                    >
                      {t("cookie.banner.reject_all")}
                    </Button>
                    <Button
                      onClick={() => setShowSettings(true)}
                      variant="ghost"
                      size="lg"
                      className="w-full font-medium"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      {t("cookie.banner.customize")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Dialog */}
      <CookieSettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
      />
    </>
  );
}
