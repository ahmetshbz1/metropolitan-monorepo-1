"use client";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores";
import { useLogout } from "@/hooks/api";
import {
  User,
  Heart,
  MapPin,
  Bell,
  Settings,
  Palette,
  HelpCircle,
  FileText,
  LogOut,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

export default function ProfilePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, accessToken } = useAuthStore();
  const logout = useLogout();

  if (!accessToken || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {t("profile.guest_title")}
          </h2>
          <p className="text-muted-foreground mb-6">
            {t("profile.guest_message")}
          </p>
          <Button asChild>
            <Link href="/auth/phone-login">{t("profile.login")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const menuSections = [
    {
      title: t("profile.account_section"),
      items: [
        {
          icon: Heart,
          label: t("profile.favorites"),
          href: "/favorites",
        },
        {
          icon: MapPin,
          label: t("profile.addresses"),
          href: "/addresses",
        },
        {
          icon: Bell,
          label: t("profile.notifications"),
          href: "/notifications",
        },
        {
          icon: Settings,
          label: t("profile.account_settings"),
          href: "/account-settings",
        },
      ],
    },
    {
      title: t("profile.app_section"),
      items: [
        {
          icon: Palette,
          label: t("profile.app_settings"),
          href: "/app-settings",
        },
      ],
    },
    {
      title: t("profile.support_section"),
      items: [
        {
          icon: HelpCircle,
          label: t("profile.help_center"),
          href: "/help",
        },
      ],
    },
    {
      title: t("profile.legal_section"),
      items: [
        {
          icon: FileText,
          label: t("profile.legal"),
          href: "/legal",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* User Info Header */}
        <div className="bg-card rounded-xl border border-border p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-muted-foreground">{user.phone || user.email}</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/edit-profile">{t("profile.header_edit")}</Link>
            </Button>
          </div>
        </div>

        {/* Menu Sections */}
        {menuSections.map((section, index) => (
          <div key={index} className="mb-6">
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
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="flex-1 font-medium">{item.label}</span>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* Logout Button */}
        <Button
          variant="destructive"
          className="w-full"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
        >
          <LogOut className="mr-2 h-5 w-5" />
          {logout.isPending ? "Çıkış yapılıyor..." : t("profile.logout")}
        </Button>

        {/* Version Info */}
        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            {t("profile.version", { version: "1.0.0" })}
          </p>
        </div>
      </div>
    </div>
  );
}
