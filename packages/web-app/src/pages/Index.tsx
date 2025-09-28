import { BrandsSection } from '@/components/BrandsSection';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ProductCarousel } from '@/components/ProductCarousel';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { translations } from '@/translations';
import { getSupportedLanguage } from '@/lib/language';
import { ArrowUp, Building2, FileText, Hash, Mail, MapPin, Menu, Phone, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const Index = () => {
  const [currentLang, setCurrentLang] = useState(() => {
    return getSupportedLanguage();
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const t = translations[currentLang as keyof typeof translations];

  const handleLanguageChange = (lang: string) => {
    setCurrentLang(lang);
    localStorage.setItem("language", lang);
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background w-full">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 max-w-7xl mx-auto">
            <div className="flex items-center">
              <img
                src="/lovable-uploads/308586f9-18ce-40d6-8e3d-9d8625dce01e.png"
                alt="Metropolitan"
                className="h-8 w-auto"
              />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <button onClick={() => scrollToSection('home')} className="text-foreground hover:text-primary transition-colors">
                {t.nav.home}
              </button>
              <button onClick={() => scrollToSection('about')} className="text-foreground hover:text-primary transition-colors">
                {t.nav.about}
              </button>
              <button onClick={() => scrollToSection('products')} className="text-foreground hover:text-primary transition-colors">
                {t.nav.products}
              </button>
              <button onClick={() => scrollToSection('contact')} className="text-foreground hover:text-primary transition-colors">
                {t.nav.contact}
              </button>
            </nav>

            <div className="flex items-center space-x-4">
              <LanguageSwitcher currentLang={currentLang} onLanguageChange={handleLanguageChange} />

              {/* Mobile menu button */}
              <button
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden">
              <div className="px-4 pt-2 pb-3 space-y-1 bg-background border-t">
                <button onClick={() => scrollToSection('home')} className="block px-3 py-2 text-foreground hover:text-primary transition-colors">
                  {t.nav.home}
                </button>
                <button onClick={() => scrollToSection('about')} className="block px-3 py-2 text-foreground hover:text-primary transition-colors">
                  {t.nav.about}
                </button>
                <button onClick={() => scrollToSection('products')} className="block px-3 py-2 text-foreground hover:text-primary transition-colors">
                  {t.nav.products}
                </button>
                <button onClick={() => scrollToSection('contact')} className="block px-3 py-2 text-foreground hover:text-primary transition-colors">
                  {t.nav.contact}
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-4 sm:inset-6 md:inset-0 z-0 rounded-2xl overflow-hidden">
          <img
            src="/lovable-uploads/233e7e08-0b56-4905-a0d5-d4f5dcafc642.png"
            alt="Turkish Food Products"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40"></div>
        </div>

        <div className="relative z-10 text-center text-white w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-hero bg-clip-text text-transparent leading-tight">
              {t.hero.title}
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl mb-3 sm:mb-4 text-white/90">
              {t.hero.subtitle}
            </p>
            <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 text-white/80 max-w-2xl mx-auto">
              {t.hero.description}
            </p>
            <Button
              variant="hero"
              size="hero"
              onClick={() => scrollToSection('contact')}
              className="text-sm sm:text-base px-6 py-3 sm:px-8 sm:py-4"
            >
              {t.hero.cta}
            </Button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-12 sm:py-16 lg:py-20 bg-card">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-foreground">
                {t.about.title}
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
                {t.about.description}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
              <Card className="text-center p-4 sm:p-6 hover:shadow-lg transition-shadow">
                <CardContent className="pt-4 sm:pt-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">{t.about.experience}</h3>
                </CardContent>
              </Card>

              <Card className="text-center p-4 sm:p-6 hover:shadow-lg transition-shadow">
                <CardContent className="pt-4 sm:pt-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">{t.about.products}</h3>
                </CardContent>
              </Card>

              <Card className="text-center p-4 sm:p-6 hover:shadow-lg transition-shadow sm:col-span-2 md:col-span-1">
                <CardContent className="pt-4 sm:pt-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Hash className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">{t.about.quality}</h3>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-12 sm:py-16 lg:py-20">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-foreground">
                {t.products.title}
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
                {t.products.subtitle}
              </p>
            </div>

            <BrandsSection currentLang={currentLang} />
            <ProductCarousel />
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-12 sm:py-16 lg:py-20 bg-card">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-foreground">
                {t.contact.title}
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
                {t.contact.subtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
              <div>
                <h3 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-foreground">{t.contact.businessInfo}</h3>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-start space-x-3">
                    <Building2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm sm:text-base">{t.contact.owner}</p>
                      <p className="text-muted-foreground">İlyas Işık</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{t.contact.generalEmail}</p>
                      <p className="text-muted-foreground">info@metropolitanfg.pl</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{t.contact.salesEmail}</p>
                      <p className="text-muted-foreground">sales@metropolitanfg.pl</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{t.contact.accountsEmail}</p>
                      <p className="text-muted-foreground">accounts@metropolitanfg.pl</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{t.contact.phone}</p>
                      <p className="text-muted-foreground">+48 600 790 035</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{t.contact.address}</p>
                      <p className="text-muted-foreground">ul. Leonidasa 57/PAW.502<br />02-239 Warszawa, Mazowieckie</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-semibold mb-6 text-foreground">Dane rejestrowe</h3>
                <div className="space-y-4">
                  <div>
                    <p className="font-medium">{t.contact.krs}</p>
                    <p className="text-muted-foreground">0000317933</p>
                  </div>

                  <div>
                    <p className="font-medium">{t.contact.nip}</p>
                    <p className="text-muted-foreground">7292645203</p>
                  </div>

                  <div>
                    <p className="font-medium">{t.contact.regon}</p>
                    <p className="text-muted-foreground">100524119</p>
                  </div>

                  <div>
                    <p className="font-medium">Kapitał zakładowy</p>
                    <p className="text-muted-foreground">173 000,00 ZŁ</p>
                  </div>

                  <div>
                    <p className="font-medium">Sąd</p>
                    <p className="text-muted-foreground text-sm">Sąd Rejonowy dla m.st. Warszawy w Warszawie, XIV Wydział Gospodarczy KRS</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-12">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-4">Metropolitan Food Group</h3>
            <p className="text-primary-foreground/80 mb-4">
              {t.footer.description}
            </p>
            <div className="mb-6 flex justify-center space-x-4">
              <a
                href="/privacy-policy"
                className="text-primary-foreground/80 hover:text-primary-foreground underline transition-colors"
              >
                {currentLang === "pl" ? "Polityka Prywatności" :
                 currentLang === "tr" ? "Gizlilik Politikası" :
                 "Privacy Policy"}
              </a>
              <span className="text-primary-foreground/60">•</span>
              <a
                href="/terms-of-service"
                className="text-primary-foreground/80 hover:text-primary-foreground underline transition-colors"
              >
                {currentLang === "pl" ? "Regulamin" :
                 currentLang === "tr" ? "Hizmet Şartları" :
                 "Terms of Service"}
              </a>
              <span className="text-primary-foreground/60">•</span>
              <a
                href="/cookie-policy"
                className="text-primary-foreground/80 hover:text-primary-foreground underline transition-colors"
              >
                {currentLang === "pl" ? "Polityka Cookies" :
                 currentLang === "tr" ? "Çerez Politikası" :
                 "Cookie Policy"}
              </a>
            </div>
            <p className="text-sm text-primary-foreground/60">
              © 2025 Metropolitan Food Group. {t.footer.rights}
            </p>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 bg-primary text-primary-foreground p-3 rounded-full shadow-lg hover:bg-primary/90 transition-all duration-300 hover:scale-110"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

export default Index;
