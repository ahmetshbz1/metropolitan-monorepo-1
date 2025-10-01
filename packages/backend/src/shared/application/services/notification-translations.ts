//  "notification-translations.ts"
//  metropolitan backend
//  Notification translations for multi-language push notifications

type Language = "tr" | "en" | "pl";

interface NotificationTranslation {
  title: string;
  body: string;
}

const notificationTranslations = {
  welcome: {
    tr: {
      title: "Metropolitan'e Hoş Geldiniz!",
      body: "Push bildirimleri başarıyla aktifleştirildi.",
    },
    en: {
      title: "Welcome to Metropolitan!",
      body: "Push notifications have been successfully activated.",
    },
    pl: {
      title: "Witamy w Metropolitan!",
      body: "Powiadomienia push zostały pomyślnie aktywowane.",
    },
  },
  orderPlaced: {
    tr: {
      title: "Siparişiniz Alındı",
      body: "Siparişiniz başarıyla oluşturuldu ve işleme alındı.",
    },
    en: {
      title: "Order Placed",
      body: "Your order has been successfully created and is being processed.",
    },
    pl: {
      title: "Zamówienie Złożone",
      body: "Twoje zamówienie zostało pomyślnie utworzone i jest przetwarzane.",
    },
  },
  orderShipped: {
    tr: {
      title: "Siparişiniz Kargoya Verildi",
      body: "Siparişiniz kargoya teslim edildi.",
    },
    en: {
      title: "Order Shipped",
      body: "Your order has been shipped.",
    },
    pl: {
      title: "Zamówienie Wysłane",
      body: "Twoje zamówienie zostało wysłane.",
    },
  },
  orderDelivered: {
    tr: {
      title: "Siparişiniz Teslim Edildi",
      body: "Siparişiniz başarıyla teslim edildi.",
    },
    en: {
      title: "Order Delivered",
      body: "Your order has been successfully delivered.",
    },
    pl: {
      title: "Zamówienie Dostarczone",
      body: "Twoje zamówienie zostało pomyślnie dostarczone.",
    },
  },
  paymentSuccess: {
    tr: {
      title: "Ödeme Başarılı",
      body: "Ödemeniz başarıyla alındı.",
    },
    en: {
      title: "Payment Successful",
      body: "Your payment has been successfully received.",
    },
    pl: {
      title: "Płatność Pomyślna",
      body: "Twoja płatność została pomyślnie otrzymana.",
    },
  },
  paymentFailed: {
    tr: {
      title: "Ödeme Başarısız",
      body: "Ödemeniz işlenirken bir hata oluştu.",
    },
    en: {
      title: "Payment Failed",
      body: "An error occurred while processing your payment.",
    },
    pl: {
      title: "Płatność Nieudana",
      body: "Wystąpił błąd podczas przetwarzania płatności.",
    },
  },
  test: {
    tr: {
      title: "Test Bildirimi",
      body: "Bu bir test bildirimidir. Sistem düzgün çalışıyor!",
    },
    en: {
      title: "Test Notification",
      body: "This is a test notification. The system is working properly!",
    },
    pl: {
      title: "Powiadomienie Testowe",
      body: "To jest powiadomienie testowe. System działa poprawnie!",
    },
  },
  orderConfirmed: {
    tr: {
      title: "Siparişiniz Onaylandı",
      body: "Siparişiniz onaylandı ve hazırlanıyor.",
    },
    en: {
      title: "Order Confirmed",
      body: "Your order has been confirmed and is being prepared.",
    },
    pl: {
      title: "Zamówienie Potwierdzone",
      body: "Twoje zamówienie zostało potwierdzone i jest przygotowywane.",
    },
  },
  orderPreparing: {
    tr: {
      title: "Siparişiniz Hazırlanıyor",
      body: "Siparişiniz hazırlanıyor.",
    },
    en: {
      title: "Order Being Prepared",
      body: "Your order is being prepared.",
    },
    pl: {
      title: "Zamówienie w Przygotowaniu",
      body: "Twoje zamówienie jest przygotowywane.",
    },
  },
  orderShipped: {
    tr: {
      title: "Kargoya Verildi",
      body: "Siparişiniz kargoya verildi. Takip kodunuzu kontrol edebilirsiniz.",
    },
    en: {
      title: "Order Shipped",
      body: "Your order has been shipped. You can check your tracking code.",
    },
    pl: {
      title: "Zamówienie Wysłane",
      body: "Twoje zamówienie zostało wysłane. Możesz sprawdzić kod śledzenia.",
    },
  },
  orderOutForDelivery: {
    tr: {
      title: "Dağıtıma Çıktı",
      body: "Siparişiniz bugün teslim edilecek.",
    },
    en: {
      title: "Out for Delivery",
      body: "Your order will be delivered today.",
    },
    pl: {
      title: "W Dostawie",
      body: "Twoje zamówienie zostanie dostarczone dzisiaj.",
    },
  },
  orderDelivered: {
    tr: {
      title: "Teslim Edildi",
      body: "Siparişiniz başarıyla teslim edildi. Afiyet olsun!",
    },
    en: {
      title: "Order Delivered",
      body: "Your order has been successfully delivered. Enjoy!",
    },
    pl: {
      title: "Zamówienie Dostarczone",
      body: "Twoje zamówienie zostało pomyślnie dostarczone. Smacznego!",
    },
  },
  orderCancelled: {
    tr: {
      title: "Sipariş İptal Edildi",
      body: "Siparişiniz iptal edildi.",
    },
    en: {
      title: "Order Cancelled",
      body: "Your order has been cancelled.",
    },
    pl: {
      title: "Zamówienie Anulowane",
      body: "Twoje zamówienie zostało anulowane.",
    },
  },
  orderRefunded: {
    tr: {
      title: "İade Edildi",
      body: "Siparişiniz için ödeme iadesi yapıldı.",
    },
    en: {
      title: "Order Refunded",
      body: "Payment refund has been processed for your order.",
    },
    pl: {
      title: "Zamówienie Zwrócone",
      body: "Zwrot płatności został przetworzony dla Twojego zamówienia.",
    },
  },
  paymentCancelled: {
    tr: {
      title: "Ödeme İptal Edildi",
      body: "Siparişinizin ödemesi iptal edildi.",
    },
    en: {
      title: "Payment Cancelled",
      body: "Payment for your order has been cancelled.",
    },
    pl: {
      title: "Płatność Anulowana",
      body: "Płatność za Twoje zamówienie została anulowana.",
    },
  },
} as const;

export type NotificationType = keyof typeof notificationTranslations;

export function getNotificationTranslation(
  type: NotificationType,
  language?: string
): NotificationTranslation {
  const lang = (language && ["tr", "en", "pl"].includes(language)
    ? language
    : "tr") as Language;

  return notificationTranslations[type][lang];
}

export function getCustomNotificationTranslation(
  translations: Record<Language, NotificationTranslation>,
  language?: string
): NotificationTranslation {
  const lang = (language && ["tr", "en", "pl"].includes(language)
    ? language
    : "tr") as Language;

  return translations[lang];
}

export function getOrderNotificationWithNumber(
  type: NotificationType,
  orderNumber: string,
  language?: string
): NotificationTranslation {
  const lang = (language && ["tr", "en", "pl"].includes(language)
    ? language
    : "tr") as Language;

  const base = notificationTranslations[type][lang];

  return {
    title: base.title,
    body: `${orderNumber} numaralı ${base.body.toLowerCase()}`,
  };
}

export function getPaymentNotificationWithNumber(
  type: "paymentSuccess" | "paymentFailed" | "paymentCancelled",
  orderNumber: string,
  language?: string
): NotificationTranslation {
  const lang = (language && ["tr", "en", "pl"].includes(language)
    ? language
    : "tr") as Language;

  const translations = {
    paymentSuccess: {
      tr: `${orderNumber} numaralı siparişiniz için ödemeniz alındı. Siparişiniz hazırlanıyor.`,
      en: `Payment received for order ${orderNumber}. Your order is being prepared.`,
      pl: `Płatność otrzymana za zamówienie ${orderNumber}. Twoje zamówienie jest przygotowywane.`,
    },
    paymentFailed: {
      tr: `${orderNumber} numaralı siparişinizin ödemesi alınamadı. Lütfen tekrar deneyin.`,
      en: `Payment for order ${orderNumber} failed. Please try again.`,
      pl: `Płatność za zamówienie ${orderNumber} nie powiodła się. Spróbuj ponownie.`,
    },
    paymentCancelled: {
      tr: `${orderNumber} numaralı siparişinizin ödemesi iptal edildi.`,
      en: `Payment for order ${orderNumber} was cancelled.`,
      pl: `Płatność za zamówienie ${orderNumber} została anulowana.`,
    },
  };

  const base = notificationTranslations[type][lang];

  return {
    title: base.title,
    body: translations[type][lang],
  };
}
