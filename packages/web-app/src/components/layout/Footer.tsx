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
  Linkedin
} from 'lucide-react';

export function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

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
  ];

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
  ];

  return (
    <footer className="bg-card border-t border-border">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              {t('footer.company_name')}
            </h3>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              {t('footer.about_description')}
            </p>
            
            {/* Social Media */}
            <div>
              <h4 className="text-lg font-semibold text-foreground mb-4">{t('footer.follow_us')}</h4>
              <div className="flex space-x-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    className="w-10 h-10 bg-muted rounded-full flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors duration-300"
                    aria-label={social.label}
                  >
                    <social.icon size={20} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-foreground mb-6">{t('footer.quick_links')}</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
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

          {/* Customer Service */}
          <div>
            <h4 className="text-lg font-semibold text-foreground mb-6">{t('footer.customer_service')}</h4>
            <ul className="space-y-3">
              {customerServiceLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            
            {/* Legal Links */}
            <div className="mt-6">
              <ul className="space-y-3">
                {legalLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-muted-foreground hover:text-primary transition-colors duration-200 text-sm"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contact Info & Newsletter */}
          <div>
            <h4 className="text-lg font-semibold text-foreground mb-6">{t('footer.contact_info')}</h4>
            
            {/* Contact Details */}
            <div className="space-y-4">
              {contactInfo.map((info) => (
                <div key={info.label} className="flex items-start space-x-3">
                  <info.icon size={18} className="text-primary mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">{info.label}</p>
                    {info.link ? (
                      <a
                        href={info.link}
                        className="text-foreground hover:text-primary transition-colors duration-200 text-sm"
                        {...(info.link.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      >
                        {info.value}
                      </a>
                    ) : (
                      <p className="text-foreground text-sm">{info.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-center items-center">
            <p className="text-muted-foreground text-sm">
              {t('footer.copyright', { year: currentYear })}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}