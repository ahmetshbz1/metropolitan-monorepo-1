"use client";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores";
import {
  User,
  Shield,
  Lock,
  Download,
  Trash2,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

export default function AccountSettingsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, accessToken } = useAuthStore();

  if (!accessToken || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Giriş Yapın</h2>
          <p className="text-muted-foreground mb-6">
            Hesap ayarlarınızı görmek için giriş yapmalısınız.
          </p>
          <Button asChild>
            <Link href="/auth/phone-login">Giriş Yap</Link>
          </Button>
        </div>
      </div>
    );
  }

  const sections = [
    {
      title: t("account_settings.general"),
      items: [
        {
          icon: User,
          label: t("account_settings.edit_profile"),
          description: t("account_settings.edit_profile_desc"),
          href: "/edit-profile",
        },
      ],
    },
    {
      title: t("account_settings.privacy"),
      items: [
        {
          icon: Shield,
          label: t("account_settings.privacy"),
          description: t("account_settings.privacy_desc"),
          href: "/privacy-settings",
        },
        {
          icon: Lock,
          label: t("account_settings.security"),
          description: t("account_settings.security_desc"),
          href: "/security-settings",
        },
      ],
    },
    {
      title: t("account_settings.danger_zone"),
      items: [
        {
          icon: Download,
          label: t("account_settings.export_data"),
          description: t("account_settings.export_data_desc"),
          href: "/export-data",
        },
        {
          icon: Trash2,
          label: "Hesabı Sil",
          description: t("account_settings.delete_account_desc"),
          href: "/delete-account",
          danger: true,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">
          {t("profile.account_settings")}
        </h1>

        {sections.map((section, index) => (
          <div key={index} className="mb-8">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase mb-3 px-2">
              {section.title}
            </h2>
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {section.items.map((item, itemIndex) => (
                <Link
                  key={itemIndex}
                  href={item.href}
                  className="flex items-center gap-4 p-4 hover:bg-muted transition-colors border-b border-border last:border-b-0"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      item.danger
                        ? "bg-red-100 dark:bg-red-900/20"
                        : "bg-primary/10"
                    }`}
                  >
                    <item.icon
                      className={`h-5 w-5 ${
                        item.danger ? "text-red-500" : "text-primary"
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <h3
                      className={`font-medium ${
                        item.danger ? "text-red-500" : ""
                      }`}
                    >
                      {item.label}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
