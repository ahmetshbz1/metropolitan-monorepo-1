"use client";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores";
import { useLogout, useCurrentUser } from "@/hooks/api";
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
  const { isLoading: userLoading } = useCurrentUser();
  const logout = useLogout();

  // Loading skeleton
  if (userLoading) {
    return (
      <div className="min-h-screen bg-background py-6">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="h-6 bg-muted rounded w-32 mb-4 animate-pulse"></div>
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
            <div className="h-48 bg-muted rounded-lg animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-24 bg-muted rounded-lg animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Guest user - redirect to login
  if (!accessToken || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {t("profile.guest_title") || "Profilinizi görüntülemek için giriş yapın"}
          </h2>
          <p className="text-muted-foreground mb-6">
            {t("profile.guest_message") || "Siparişlerinizi takip edin ve adreslerinizi yönetin"}
          </p>
          <Button asChild>
            <Link href="/auth/phone-login">{t("profile.login") || "Giriş Yap"}</Link>
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
    <div className="min-h-screen bg-background py-6">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Compact Header */}
        <div className="mb-4">
          <h1 className="text-lg font-bold">{t("profile.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("profile.subtitle")}
          </p>
        </div>

        {/* Two Column Layout - Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
          {/* Left - User Info Card */}
          <div className="bg-card rounded-lg border p-4">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                <User className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-base font-bold mb-0.5">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-xs text-muted-foreground mb-3">{user.phone || user.email}</p>
              <Button variant="outline" asChild size="sm" className="w-full">
                <Link href="/edit-profile">{t("profile.header_edit")}</Link>
              </Button>
            </div>
          </div>

          {/* Right - Menu Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuSections.map((section, sectionIndex) => (
              section.items.map((item, itemIndex) => (
                <Link
                  key={`${sectionIndex}-${itemIndex}`}
                  href={item.href}
                  className="group bg-card rounded-lg border p-4 hover:shadow-md hover:border-primary/30 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm mb-0.5 group-hover:text-primary transition-colors">
                        {item.label}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {sectionIndex === 0 && itemIndex === 0 && t("profile.menu_items.favorites_desc")}
                        {sectionIndex === 0 && itemIndex === 1 && t("profile.menu_items.addresses_desc")}
                        {sectionIndex === 0 && itemIndex === 2 && t("profile.menu_items.notifications_desc")}
                        {sectionIndex === 0 && itemIndex === 3 && t("profile.menu_items.account_settings_desc")}
                        {sectionIndex === 1 && itemIndex === 0 && t("profile.menu_items.help_center_desc")}
                        {sectionIndex === 2 && itemIndex === 0 && t("profile.menu_items.legal_desc")}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform flex-shrink-0 mt-1" />
                  </div>
                </Link>
              ))
            ))}
          </div>
        </div>

        {/* Logout Button - Full Width Below */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {logout.isPending ? t("profile.logging_out") : t("profile.logout")}
          </Button>

          {/* Version Info */}
          <div className="flex items-center justify-center md:justify-start">
            <p className="text-sm text-muted-foreground">
              {t("profile.version", { version: "1.0.0" })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
