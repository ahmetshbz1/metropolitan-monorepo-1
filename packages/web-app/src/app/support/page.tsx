"use client";

import {
  Mail,
  Phone,
  MessageCircle,
  MapPin,
  ChevronRight,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function SupportPage() {
  const { t } = useTranslation();
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const handleGetDirections = () => {
    const address = "Aleja Krakowska 44, 05-090 Janki, Warsaw, Poland";
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  const contactMethods = [
    {
      id: "whatsapp",
      title: t("support.whatsapp"),
      subtitle: "+48 600 790 035",
      icon: MessageCircle,
      color: "#25D366",
      action: () => window.open(`https://wa.me/48600790035?text=${encodeURIComponent(t("support.whatsapp_message"))}`, '_blank'),
    },
    {
      id: "phone",
      title: t("support.call_us"),
      subtitle: "+48 600 790 035",
      icon: Phone,
      color: "hsl(var(--primary))",
      action: () => window.location.href = "tel:+48600790035",
    },
    {
      id: "email",
      title: t("support.email"),
      subtitle: "info@metropolitanfg.pl",
      icon: Mail,
      color: "hsl(var(--primary))",
      action: () => window.location.href = "mailto:info@metropolitanfg.pl",
    },
    {
      id: "address",
      title: t("support.address"),
      subtitle: "Aleja Krakowska 44, 05-090 Janki",
      icon: MapPin,
      color: "hsl(var(--primary))",
      action: handleGetDirections,
    },
  ];

  const socialMethods = [
    {
      id: "instagram",
      title: t("support.instagram"),
      subtitle: "@metropolitanfg_pl",
      icon: Instagram,
      color: "#E4405F",
      action: () => window.open("https://www.instagram.com/metropolitanfg_pl/", '_blank'),
    },
    {
      id: "facebook",
      title: t("support.facebook"),
      subtitle: "Metropolitan Food Group",
      icon: Facebook,
      color: "#1877F2",
      action: () => window.open("https://www.facebook.com/profile.php?id=61581536105076", '_blank'),
    },
    {
      id: "twitter",
      title: t("support.twitter"),
      subtitle: "@metropolitan_fg",
      icon: Twitter,
      color: "#1DA1F2",
      action: () => window.open("https://x.com/metropolitan_fg", '_blank'),
    },
    {
      id: "linkedin",
      title: t("support.linkedin"),
      subtitle: "Metropolitan Food Group",
      icon: Linkedin,
      color: "#0A66C2",
      action: () => window.open("https://www.linkedin.com/in/metropolitan-food-group-57a003388/", '_blank'),
    },
  ];

  const faqItems = [
    {
      id: "delivery",
      question: t("support.faq.delivery_question"),
      answer: t("support.faq.delivery_answer"),
    },
    {
      id: "payment",
      question: t("support.faq.payment_question"),
      answer: t("support.faq.payment_answer"),
    },
    {
      id: "return",
      question: t("support.faq.return_question"),
      answer: t("support.faq.return_answer"),
    },
    {
      id: "cancel",
      question: t("support.faq.cancel_question"),
      answer: t("support.faq.cancel_answer"),
    },
  ];

  const toggleFaq = (id: string) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Contact Section */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
            {t("support.contact_section")}
          </h2>
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            {contactMethods.map((method, index) => {
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  onClick={method.action}
                  className="w-full flex items-center p-4 hover:bg-muted/50 transition-colors border-b border-border last:border-b-0"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                    style={{ 
                      backgroundColor: method.id === 'whatsapp' ? '#25D36620' : 'hsl(var(--primary) / 0.1)'
                    }}
                  >
                    <Icon 
                      className="w-5 h-5" 
                      style={{ 
                        color: method.id === 'whatsapp' ? '#25D366' : 'hsl(var(--primary))'
                      }} 
                    />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium">{method.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {method.subtitle}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Social Media Section */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
            {t("support.social_section")}
          </h2>
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            {socialMethods.map((method, index) => {
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  onClick={method.action}
                  className="w-full flex items-center p-4 hover:bg-muted/50 transition-colors border-b border-border last:border-b-0"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                    style={{ backgroundColor: `${method.color}20` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: method.color }} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium">{method.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {method.subtitle}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              );
            })}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
            {t("support.faq_section")}
          </h2>
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            {faqItems.map((item, index) => (
              <div key={item.id}>
                <button
                  onClick={() => toggleFaq(item.id)}
                  className="w-full flex items-center p-4 hover:bg-muted/50 transition-colors border-b border-border last:border-b-0"
                >
                  <div className="flex-1 text-left">
                    <p className="font-medium">{item.question}</p>
                  </div>
                  {expandedFaq === item.id ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground ml-2" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground ml-2" />
                  )}
                </button>
                {expandedFaq === item.id && (
                  <div className="px-4 pb-4 border-b border-border last:border-b-0">
                    <p className="text-sm text-muted-foreground">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Help Center Info */}
        <div>
          <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20">
            <div className="flex items-center mb-3">
              <Info className="w-6 h-6 text-primary" />
              <h3 className="font-semibold ml-2">{t("support.help_center")}</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {t("support.help_center_desc")}
            </p>
            <p className="text-sm font-medium">{t("support.working_hours")}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {t("support.working_hours_weekdays")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("support.working_hours_weekend")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
