"use client";

import { FileText, MapPin, Phone, Mail } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function LegalPage() {
  const { t } = useTranslation();

  const documents = [
    {
      title: t("legal.terms_of_service"),
      description: t("legal.terms_desc"),
      href: "/terms",
      icon: FileText,
    },
    {
      title: t("legal.privacy_policy"),
      description: t("legal.privacy_desc"),
      href: "/privacy",
      icon: FileText,
    },
    {
      title: t("legal.cookie_policy"),
      description: t("legal.cookie_desc"),
      href: "/cookies",
      icon: FileText,
    },
    {
      title: t("legal.gdpr"),
      description: t("legal.gdpr_desc"),
      href: "/gdpr",
      icon: FileText,
    },
  ];

  const companyInfo = [
    {
      icon: MapPin,
      label: t("footer.address"),
      value: "ul. Aleja Krakowska 44, 05-090 Janki, Warsaw",
    },
    {
      icon: Phone,
      label: t("footer.phone"),
      value: "+48 600 790 035",
    },
    {
      icon: Mail,
      label: t("footer.email"),
      value: "info@metropolitanfg.pl",
    },
  ];

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">{t("legal.title")}</h1>

        {/* Legal Documents */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4">
            {t("legal.documents_section")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((doc, index) => (
              <Link
                key={index}
                href={doc.href}
                className="bg-card rounded-xl border border-border p-6 hover:border-primary transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <doc.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{doc.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {doc.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Company Information */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4">
            {t("legal.company_info_section")}
          </h2>
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-bold text-lg mb-4">
              Metropolitan Food Group Sp. z o.o.
            </h3>
            <div className="space-y-4">
              {companyInfo.map((info, index) => (
                <div key={index} className="flex items-start gap-3">
                  <info.icon className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">{info.label}</p>
                    <p className="font-medium">{info.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legal Notice */}
        <div className="bg-muted/50 rounded-xl p-6">
          <h3 className="font-semibold mb-2">{t("legal.notice_title")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("legal.notice_desc")}
          </p>
        </div>
      </div>
    </div>
  );
}
