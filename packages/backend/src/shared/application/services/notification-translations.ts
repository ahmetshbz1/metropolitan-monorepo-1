//  "notification-translations.ts"
//  metropolitan backend
//  Notification translations for multi-language push notifications

import enTranslations from "../../locales/en.json";
import plTranslations from "../../locales/pl.json";
import trTranslations from "../../locales/tr.json";

type Language = "tr" | "en" | "pl";

interface NotificationTranslation {
  title: string;
  body: string;
}

const translations = {
  tr: trTranslations.notifications,
  en: enTranslations.notifications,
  pl: plTranslations.notifications,
};

export type NotificationType = keyof typeof translations.tr;

export function getNotificationTranslation(
  type: NotificationType,
  language?: string
): NotificationTranslation {
  const lang = (
    language && ["tr", "en", "pl"].includes(language) ? language : "tr"
  ) as Language;

  return translations[lang][type];
}

export function getCustomNotificationTranslation(
  customTranslations: Record<Language, NotificationTranslation>,
  language?: string
): NotificationTranslation {
  const lang = (
    language && ["tr", "en", "pl"].includes(language) ? language : "tr"
  ) as Language;

  return customTranslations[lang];
}

export function getPaymentNotificationWithNumber(
  type: "payment_success" | "payment_failed" | "payment_cancelled",
  orderNumber: string,
  language?: string
): NotificationTranslation {
  const lang = (
    language && ["tr", "en", "pl"].includes(language) ? language : "tr"
  ) as Language;

  const base = translations[lang][type] as any;

  return {
    title: base.title,
    body: base.body_with_order
      ? base.body_with_order.replace("{orderNumber}", orderNumber)
      : base.body,
  };
}

export function getOrderStatusNotificationWithNumber(
  status:
    | "confirmed"
    | "preparing"
    | "shipped"
    | "out_for_delivery"
    | "delivered"
    | "cancelled"
    | "refunded",
  orderNumber: string,
  language?: string
): NotificationTranslation {
  const lang = (
    language && ["tr", "en", "pl"].includes(language) ? language : "tr"
  ) as Language;

  const statusTypeMap = {
    confirmed: "order_confirmed",
    preparing: "order_preparing",
    shipped: "order_shipped",
    out_for_delivery: "order_out_for_delivery",
    delivered: "order_delivered",
    cancelled: "order_cancelled",
    refunded: "order_refunded",
  } as const;

  const notificationType = statusTypeMap[status];
  const base = translations[lang][notificationType] as any;

  return {
    title: base.title,
    body: base.body_with_order
      ? base.body_with_order.replace("{orderNumber}", orderNumber)
      : base.body,
  };
}
