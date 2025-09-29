"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  HelpCircle,
  Search,
  ChevronDown,
  Mail,
  Phone,
  MessageCircle,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function HelpPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqItems = [
    {
      question: t("faq.q1.question"),
      answer: t("faq.q1.answer"),
    },
    {
      question: t("faq.q2.question"),
      answer: t("faq.q2.answer"),
    },
    {
      question: t("faq.q3.question"),
      answer: t("faq.q3.answer"),
    },
    {
      question: t("faq.q4.question"),
      answer: t("faq.q4.answer"),
    },
  ];

  const contactMethods = [
    {
      icon: Mail,
      title: "E-posta",
      value: "info@metropolitanfg.pl",
      action: "mailto:info@metropolitanfg.pl",
    },
    {
      icon: Phone,
      title: "Telefon",
      value: "+48 600 790 035",
      action: "tel:+48600790035",
    },
    {
      icon: MessageCircle,
      title: "WhatsApp",
      value: "Canlı Destek",
      action: "https://wa.me/48600790035",
    },
  ];

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-3">{t("help_center.title")}</h1>
          <p className="text-lg text-muted-foreground">
            {t("help_center.header")}
          </p>
        </div>

        {/* Search */}
        <div className="mb-12">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t("help_center.search_placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 text-lg"
            />
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">{t("faq.title")}</h2>
          <div className="space-y-3">
            {faqItems.map((item, index) => (
              <div
                key={index}
                className="bg-card rounded-xl border border-border overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-muted transition-colors"
                >
                  <span className="font-semibold pr-4">{item.question}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform ${
                      openFaq === index ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-4 pb-4 pt-0">
                    <p className="text-muted-foreground">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Methods */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Bize Ulaşın</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {contactMethods.map((method, index) => (
              <a
                key={index}
                href={method.action}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-card rounded-xl border border-border p-6 hover:border-primary transition-colors text-center"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <method.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">{method.title}</h3>
                <p className="text-sm text-muted-foreground">{method.value}</p>
              </a>
            ))}
          </div>
        </div>

        {/* Working Hours */}
        <div className="mt-8 bg-muted/50 rounded-xl p-6 text-center">
          <h3 className="font-semibold mb-2">{t("support.working_hours")}</h3>
          <p className="text-muted-foreground">
            {t("support.working_hours_weekdays")}
            <br />
            {t("support.working_hours_weekend")}
          </p>
        </div>
      </div>
    </div>
  );
}
