"use client";

import { QRDialog } from "@/components/ui/qr-dialog";
import {
  Clock,
  ExternalLink,
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Search,
  Twitter,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export function Footer() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const currentYear = new Date().getFullYear();
  const [qrDialogOpen, setQrDialogOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <footer className="bg-background border-t border-border">
        <div className="bg-background py-12">
          <div className="max-w-7xl mx-auto px-6">
            <div className="animate-pulse">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-4">
                    <div className="h-6 bg-muted rounded w-32"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-24"></div>
                      <div className="h-4 bg-muted rounded w-20"></div>
                      <div className="h-4 bg-muted rounded w-28"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  const contactInfo = [
    {
      icon: MapPin,
      label: t("footer.address"),
      value: "Aleja Krakowska 44, 05-090 Janki",
      link: "https://www.google.com/maps/search/?api=1&query=Aleja+Krakowska+44,+05-090+Janki,+Warsaw,+Poland",
    },
    {
      icon: Phone,
      label: t("footer.phone"),
      value: "+48 600 790 035",
      link: "tel:+48600790035",
    },
    {
      icon: Mail,
      label: t("footer.email"),
      value: "info@metropolitanfg.pl",
      link: "mailto:info@metropolitanfg.pl",
    },
    {
      icon: Clock,
      label: t("footer.working_hours"),
      value: t("support.working_hours_weekdays") + "\n" + t("support.working_hours_weekend"),
      link: null,
    },
  ];

  const quickLinks = [
    { label: t("footer.products"), href: "/products" },
    { label: t("footer.categories"), href: "/categories" },
    { label: t("footer.special_offers"), href: "/offers" },
    { label: t("footer.new_arrivals"), href: "/new" },
  ];

  const customerServiceLinks = [
    { label: t("footer.help_center"), href: "/support" },
    { label: t("footer.contact_us"), href: "/support" },
    { label: t("footer.faq"), href: "/support" },
    { label: t("footer.delivery_info"), href: "/support" },
    { label: t("footer.return_policy"), href: "/support" },
  ];

  const legalLinks = [
    { label: t("footer.privacy_policy"), href: "/privacy" },
    { label: t("footer.terms_of_service"), href: "/terms" },
    { label: t("footer.cookie_policy"), href: "/cookies" },
  ];

  const socialLinks = [
    { icon: Facebook, href: "https://facebook.com/metropolitanfg", label: "Facebook" },
    { icon: Instagram, href: "https://instagram.com/metropolitanfg", label: "Instagram" },
    { icon: Twitter, href: "https://twitter.com/metropolitanfg", label: "Twitter" },
    { icon: Linkedin, href: "https://linkedin.com/company/metropolitanfg", label: "LinkedIn" },
  ];

  return (
    <footer>
      {/* Main Footer - Theme-aware Background */}
      <div className="bg-background border-t border-border">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Company Info */}
            <div>
              <h3 className="text-lg font-bold mb-4 text-foreground">
                {t("footer.about_us")}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t("footer.about_description")}
              </p>

              {/* Social Media Icons */}
              <div className="flex space-x-3 mt-6">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 bg-muted hover:bg-primary hover:text-primary-foreground rounded-full flex items-center justify-center transition-colors duration-200"
                    >
                      <Icon size={18} />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-lg font-bold mb-4 text-foreground">
                {t("footer.contact_info")}
              </h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="text-primary mt-0.5 flex-shrink-0" />
                    <a
                      href="https://www.google.com/maps/search/?api=1&query=Aleja+Krakowska+44,+05-090+Janki,+Warsaw,+Poland"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      Aleja Krakowska 44,<br />05-090 Janki, Warsaw
                    </a>
                  </div>
                </li>
                <li>
                  <div className="flex items-start gap-2">
                    <Phone size={16} className="text-primary mt-0.5 flex-shrink-0" />
                    <a
                      href="tel:+48600790035"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      +48 600 790 035
                    </a>
                  </div>
                </li>
                <li>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-start gap-2">
                      <Mail size={16} className="text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex flex-col gap-1">
                        <a
                          href="mailto:info@metropolitanfg.pl"
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          info@metropolitanfg.pl
                        </a>
                        <a
                          href="mailto:accounts@metropolitanfg.pl"
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          accounts@metropolitanfg.pl
                        </a>
                        <a
                          href="mailto:sales@metropolitanfg.pl"
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          sales@metropolitanfg.pl
                        </a>
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-bold mb-4 text-foreground">
                {t("footer.quick_links")}
              </h3>
              <ul className="space-y-2 text-sm">
                {quickLinks.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-muted-foreground hover:text-primary transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
                {legalLinks.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-muted-foreground hover:text-primary transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Mobile App */}
            <div>
              <h3 className="text-lg font-bold mb-4 text-foreground">
                {t("footer.mobile_app")}
              </h3>

              {/* QR Code */}
              <div className="mb-4">
                <div
                  className="relative w-20 h-20 bg-card border border-border rounded-lg flex items-center justify-center mb-3 p-1 cursor-pointer group overflow-hidden transition-all duration-300"
                  onClick={() => setQrDialogOpen(true)}
                >
                  <img
                    src="/qr.svg"
                    alt="QR Code"
                    className="w-full h-full transition-opacity duration-300 group-hover:opacity-30"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Search size={24} className="text-primary" />
                  </div>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t("footer.mobile_app_description")}
                </p>
              </div>

              {/* App Store Buttons */}
              <div className="flex space-x-2">
                <a
                  href="#"
                  className="hover:opacity-80 transition-opacity duration-200"
                >
                  <img
                    src="/app-store-badge.svg"
                    alt="App Store'dan İndir"
                    className="h-10 w-auto"
                  />
                </a>
                <a
                  href="#"
                  className="hover:opacity-80 transition-opacity duration-200"
                >
                  <img
                    src="/google-play-badge.svg"
                    alt="Google Play'den İndir"
                    className="h-10 w-auto"
                  />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Dialog */}
      <QRDialog open={qrDialogOpen} onOpenChange={setQrDialogOpen} />
    </footer>
  );
}
