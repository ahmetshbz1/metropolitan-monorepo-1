'use client';

import { useTranslation } from 'react-i18next';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  ExternalLink,
  QrCode,
  CreditCard,
  Smartphone,
  Search
} from 'lucide-react';
import { useState } from 'react';
import { QRDialog } from '@/components/ui/qr-dialog';

export function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  const [qrDialogOpen, setQrDialogOpen] = useState(false);

  const contactInfo = [
    {
      icon: MapPin,
      label: t('footer.address'),
      value: t('footer.address_value'),
      link: 'https://maps.google.com/?q=ul.+Aleja+Krakowska+44,+05-090+Janki,+Warsaw'
    },
    {
      icon: Phone,
      label: t('footer.phone'),
      value: t('footer.phone_value'),
      link: `tel:${t('footer.phone_value')}`
    },
    {
      icon: Mail,
      label: t('footer.email'),
      value: t('footer.email_value'),
      link: `mailto:${t('footer.email_value')}`
    },
    {
      icon: Clock,
      label: t('footer.working_hours'),
      value: t('footer.working_hours_value'),
      link: null
    }
  ];

  const quickLinks = [
    { label: t('footer.products'), href: '/products' },
    { label: t('footer.categories'), href: '/categories' },
    { label: t('footer.special_offers'), href: '/offers' },
    { label: t('footer.new_arrivals'), href: '/new' },
  ];

  const customerServiceLinks = [
    { label: t('footer.help_center'), href: '/help' },
    { label: t('footer.contact_us'), href: '/contact' },
    { label: t('footer.faq'), href: '/faq' },
    { label: t('footer.delivery_info'), href: '/delivery' },
    { label: t('footer.return_policy'), href: '/returns' },
  ];

  const legalLinks = [
    { label: t('footer.privacy_policy'), href: '/privacy' },
    { label: t('footer.terms_of_service'), href: '/terms' },
    { label: t('footer.cookie_policy'), href: '/cookies' },
  ];

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
  ];

  return (
    <footer>
      {/* Main Footer - Theme-aware Background */}
      <div className="bg-background border-t border-border">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Company Info - like "Fox Hakkında" */}
            <div>
              <h3 className="text-lg font-bold mb-4 text-foreground">
                {t('footer.about_us')}
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center gap-1">
                    {t('footer.company_name')}
                  </a>
                </li>
                <li>
                  <a href="/about" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                    Faaliyet gösterdiğimiz şehirler
                  </a>
                </li>
                <li>
                  <a href="/work-with-us" className="text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center gap-1">
                    Bizimle çalışmak <ExternalLink size={12} />
                  </a>
                </li>
                <li>
                  <a href="/media" className="text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center gap-1">
                    Medya için <ExternalLink size={12} />
                  </a>
                </li>
                <li>
                  <a href="/corporate" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                    Kurumsal Kart
                  </a>
                </li>
              </ul>
              
              {/* Social Media Icons */}
              <div className="flex space-x-3 mt-6">
                <a href="#" className="w-9 h-9 bg-muted hover:bg-primary hover:text-primary-foreground rounded-full flex items-center justify-center transition-colors duration-200">
                  <Instagram size={18} />
                </a>
                <a href="#" className="w-9 h-9 bg-muted hover:bg-primary hover:text-primary-foreground rounded-full flex items-center justify-center transition-colors duration-200">
                  <Facebook size={18} />
                </a>
                <a href="#" className="w-9 h-9 bg-muted hover:bg-primary hover:text-primary-foreground rounded-full flex items-center justify-center transition-colors duration-200">
                  <Twitter size={18} />
                </a>
              </div>
            </div>

            {/* Help - like "Yardım" */}
            <div>
              <h3 className="text-lg font-bold mb-4 text-foreground">
                {t('footer.customer_service')}
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/help" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                    SSS
                  </a>
                </li>
                <li>
                  <a href="/delivery" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                    {t('footer.delivery_info')}
                  </a>
                </li>
                <li>
                  <a href="/working-hours" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                    Açılış saatleri
                  </a>
                </li>
                <li>
                  <a href="/complaints" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                    İadeler
                  </a>
                </li>
                <li>
                  <a href="/contact" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                    Temas etmek
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal - like "Bilgi" */}
            <div>
              <h3 className="text-lg font-bold mb-4 text-foreground">
                Bilgi
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/store-management" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                    Mağaza yöneticileri
                  </a>
                </li>
                <li>
                  <a href="/promotions" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                    Promosyon ve yarışma kuralları
                  </a>
                </li>
                <li>
                  <a href="/privacy" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                    {t('footer.privacy_policy')}
                  </a>
                </li>
                <li>
                  <a href="/accessibility" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                    Erişilebilirlik Beyanı
                  </a>
                </li>
                <li>
                  <a href="/discontinued-products" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                    Üretimi durdurulan ürünler
                  </a>
                </li>
                <li>
                  <a href="/cookies" className="text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center gap-1">
                    Çerezler <ExternalLink size={12} />
                  </a>
                </li>
              </ul>
            </div>

            {/* Mobile App - like "Uygulama" */}
            <div>
              <h3 className="text-lg font-bold mb-4 text-foreground">
                {t('footer.mobile_app')}
              </h3>
              
              {/* QR Code */}
              <div className="mb-4">
                <div
                  className="relative w-20 h-20 bg-card border border-border rounded-lg flex items-center justify-center mb-3 p-1 cursor-pointer group overflow-hidden transition-all duration-300"
                  onClick={() => setQrDialogOpen(true)}
                >
                  <img src="/qr.svg" alt="QR Code" className="w-full h-full transition-opacity duration-300 group-hover:opacity-30" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Search size={24} className="text-primary" />
                  </div>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t('footer.mobile_app_description')}
                </p>
              </div>

              {/* App Store Buttons */}
              <div className="flex space-x-2">
                <a
                  href="#"
                  className="hover:opacity-80 transition-opacity duration-200"
                >
                  <img src="/app-store-badge.svg" alt="App Store'dan İndir" className="h-10 w-auto" />
                </a>
                <a
                  href="#"
                  className="hover:opacity-80 transition-opacity duration-200"
                >
                  <img src="/google-play-badge.svg" alt="Google Play'den İndir" className="h-10 w-auto" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* QR Dialog */}
      <QRDialog 
        open={qrDialogOpen} 
        onOpenChange={setQrDialogOpen} 
      />
    </footer>
  );
}