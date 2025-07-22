//  "faq.content.ts"
//  metropolitan backend
//  Created by Ahmet on 02.07.2025.

export const faqContent = {
  title: "Sıkça Sorulan Sorular (SSS)",
  lastUpdated: "2025-06-23",
  sections: [
    {
      title: "Sipariş ve Teslimat",
      questions: [
        {
          question: "Siparişimi nasıl takip edebilirim?",
          answer:
            "Siparişiniz kargoya verildikten sonra, 'Siparişlerim' bölümünden kargo takip numaranıza ulaşabilir ve kargonun durumunu anlık olarak izleyebilirsiniz.",
        },
        {
          question: "Teslimat süreleri ne kadar?",
          answer:
            "Polonya içi teslimatlar genellikle 1-3 iş günü içerisinde tamamlanmaktadır. Teslimat süreleri bölgeye ve kargo şirketinin yoğunluğuna göre değişiklik gösterebilir.",
        },
        {
          question: "Kargo ücreti ne kadar?",
          answer:
            "Kargo ücreti, siparişinizin ağırlığına ve teslimat adresine göre otomatik olarak hesaplanır. Sepet sayfasında toplam tutara eklenen kargo ücretini görebilirsiniz.",
        },
      ],
    },
    {
      title: "Ödeme",
      questions: [
        {
          question: "Hangi ödeme yöntemlerini kullanabilirim?",
          answer:
            "Kredi kartı, banka kartı ve online ödeme sistemleri (örn. Blik) ile güvenli bir şekilde ödeme yapabilirsiniz.",
        },
        {
          question: "Ödeme bilgilerim güvende mi?",
          answer:
            "Evet. Ödeme altyapımız, PCI DSS standartlarına uygun, uçtan uca şifrelenmiş bir sistem kullanmaktadır. Kart bilgileriniz sunucularımızda saklanmaz.",
        },
      ],
    },
    {
      title: "İade ve İptal",
      questions: [
        {
          question: "Siparişimi nasıl iptal edebilirim?",
          answer:
            "Siparişiniz 'Onaylandı' durumundaysa, 'Siparişlerim' bölümünden 'Siparişi İptal Et' butonuna tıklayarak iptal işlemini başlatabilirsiniz. Kargoya verilmiş siparişler için iptal işlemi yapılamamaktadır.",
        },
        {
          question: "İade politikanız nedir?",
          answer:
            "Kullanılmamış ve ambalajı bozulmamış ürünleri, teslimat tarihinden itibaren 14 gün içinde iade edebilirsiniz. İade koşulları hakkında detaylı bilgi için Kullanım Koşulları belgemize göz atabilirsiniz.",
        },
      ],
    },
    {
      title: "Hesap ve B2B",
      questions: [
        {
          question: "NIP numarası neden gerekli?",
          answer:
            "NIP (Vergi Kimlik Numarası), B2B (işletmeler arası) müşterilerimizi doğrulamak ve onlara özel fiyatlandırma ve faturalandırma seçenekleri sunmak için gereklidir.",
        },
        {
          question: "Şifremi unuttum, ne yapmalıyım?",
          answer:
            "Giriş ekranındaki 'Şifremi Unuttum' bağlantısına tıklayarak, kayıtlı telefon numaranıza gönderilecek OTP kodu ile yeni bir şifre belirleyebilirsiniz.",
        },
      ],
    },
    {
      title: "Veri Gizliliği",
      questions: [
        {
          question: "Kişisel verilerim nasıl korunuyor?",
          answer:
            "Kişisel verileriniz, Avrupa Birliği Genel Veri Koruma Tüzüğü (GDPR) uyarınca en yüksek güvenlik standartlarıyla korunmaktadır. Detaylı bilgi için 'Kullanım Koşulları ve Gizlilik Politikası' sayfamızı inceleyebilirsiniz.",
        },
        {
          question: "Hesabımı ve verilerimi nasıl silebilirim?",
          answer:
            "Uygulama içerisindeki 'Ayarlar > Hesabı Sil' menüsünden hesabınızı ve ilgili tüm verilerinizi kalıcı olarak silebilirsiniz. Bu işlem geri alınamaz.",
        },
      ],
    },
  ],
};
