import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Shield, ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { getSupportedLanguage } from "@/lib/language";

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  const [selectedLanguage, setSelectedLanguage] = useState<string>(() => {
    return getSupportedLanguage();
  });
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    localStorage.setItem("language", lang);
  };

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(Math.min(progress, 100));
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const loadPrivacyPolicy = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/privacy-policy-${selectedLanguage}.md`);
        const text = await response.text();
        setContent(text);
      } catch (error) {
        console.error("Error loading privacy policy:", error);
        setContent("# Error\n\nFailed to load privacy policy.");
      } finally {
        setIsLoading(false);
      }
    };

    loadPrivacyPolicy();
  }, [selectedLanguage]);

  const formatContent = (text: string) => {
    // Convert markdown to HTML-like structure
    const lines = text.split("\n");
    const elements: JSX.Element[] = [];
    let currentSection: string[] = [];
    let inList = false;
    let listItems: string[] = [];

    const processSection = () => {
      if (currentSection.length > 0) {
        const text = currentSection.join(" ").trim();
        if (text) {
          elements.push(
            <p key={elements.length} className="mb-4 text-gray-700 leading-relaxed">
              {text}
            </p>
          );
        }
        currentSection = [];
      }
    };

    const processList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={elements.length} className="mb-4 ml-6 space-y-2">
            {listItems.map((item, idx) => (
              <li key={idx} className="flex items-start">
                <span className="text-primary mr-2 mt-1">•</span>
                <span className="text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        );
        listItems = [];
      }
    };

    lines.forEach((line, index) => {
      // Skip the first two lines (document title and main header)
      if (index < 2) return;

      // Headers
      if (line.startsWith("### ")) {
        processSection();
        processList();
        elements.push(
          <h3 key={elements.length} className="text-xl font-semibold text-gray-900 mb-3 mt-6">
            {line.substring(4)}
          </h3>
        );
      } else if (line.startsWith("## ")) {
        processSection();
        processList();
        elements.push(
          <h2 key={elements.length} className="text-2xl font-bold text-gray-900 mb-4 mt-8 pb-2 border-b border-gray-200">
            {line.substring(3)}
          </h2>
        );
      } else if (line.startsWith("# ")) {
        processSection();
        processList();
        elements.push(
          <h1 key={elements.length} className="text-3xl font-bold text-gray-900 mb-6">
            {line.substring(2)}
          </h1>
        );
      }
      // List items
      else if (line.trim().startsWith("-") || line.trim().startsWith("•")) {
        processSection();
        inList = true;
        const item = line.trim().substring(1).trim();
        if (item) listItems.push(item);
      }
      // Numbered list items
      else if (line.trim().match(/^\d+\./)) {
        processSection();
        inList = true;
        const item = line.trim().replace(/^\d+\./, "").trim();
        if (item) listItems.push(item);
      }
      // Bold text
      else if (line.includes("**")) {
        processSection();
        processList();
        const parts = line.split("**");
        const formatted: JSX.Element[] = [];
        parts.forEach((part, idx) => {
          if (idx % 2 === 1) {
            formatted.push(<strong key={idx} className="font-semibold text-gray-900">{part}</strong>);
          } else if (part) {
            formatted.push(<span key={idx}>{part}</span>);
          }
        });
        elements.push(
          <p key={elements.length} className="mb-4 text-gray-700 leading-relaxed">
            {formatted}
          </p>
        );
      }
      // Empty line
      else if (line.trim() === "") {
        if (inList) {
          processList();
          inList = false;
        } else {
          processSection();
        }
      }
      // Regular paragraph
      else if (line.trim()) {
        if (inList) {
          processList();
          inList = false;
        }
        currentSection.push(line);
      }
    });

    processSection();
    processList();

    return elements;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-200">
        <div
          className="h-full bg-gradient-to-r from-primary to-blue-600 transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="sticky top-1 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-2">
          {/* Mobile: Dropdown + Language Switcher */}
          <div className="sm:hidden">
            <div className="flex items-center justify-between">
              <div className="relative flex-1 mr-3" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-primary">
                    {selectedLanguage === "en" && "Privacy Policy"}
                    {selectedLanguage === "pl" && "Polityka Prywatności"}
                    {selectedLanguage === "tr" && "Gizlilik Politikası"}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                    <button
                      disabled
                      className="w-full px-3 py-2 text-sm text-left bg-gray-50 text-primary font-medium cursor-not-allowed"
                    >
                      {selectedLanguage === "en" && "Privacy Policy (Current)"}
                      {selectedLanguage === "pl" && "Polityka Prywatności (Bieżący)"}
                      {selectedLanguage === "tr" && "Gizlilik Politikası (Mevcut)"}
                    </button>
                    <button
                      onClick={() => {
                        navigate("/terms-of-service");
                        setIsDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors"
                    >
                      {selectedLanguage === "en" && "Terms of Service"}
                      {selectedLanguage === "pl" && "Regulamin"}
                      {selectedLanguage === "tr" && "Hizmet Şartları"}
                    </button>
                    <button
                      onClick={() => {
                        navigate("/cookie-policy");
                        setIsDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors"
                    >
                      {selectedLanguage === "en" && "Cookie Policy"}
                      {selectedLanguage === "pl" && "Polityka Cookies"}
                      {selectedLanguage === "tr" && "Çerez Politikası"}
                    </button>
                  </div>
                )}
              </div>
              <LanguageSwitcher
                currentLang={selectedLanguage}
                onLanguageChange={handleLanguageChange}
              />
            </div>
          </div>

          {/* Desktop: Original Tabs */}
          <div className="hidden sm:flex items-center justify-between">
            <div className="flex space-x-4">
              <Button
                variant="ghost"
                size="sm"
                disabled
                className="text-primary font-semibold"
              >
                {selectedLanguage === "en" && "Privacy Policy"}
                {selectedLanguage === "pl" && "Polityka Prywatności"}
                {selectedLanguage === "tr" && "Gizlilik Politikası"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/terms-of-service")}
                className="text-gray-600 hover:text-white hover:bg-primary"
              >
                {selectedLanguage === "en" && "Terms of Service"}
                {selectedLanguage === "pl" && "Regulamin"}
                {selectedLanguage === "tr" && "Hizmet Şartları"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/cookie-policy")}
                className="text-gray-600 hover:text-white hover:bg-primary"
              >
                {selectedLanguage === "en" && "Cookie Policy"}
                {selectedLanguage === "pl" && "Polityka Cookies"}
                {selectedLanguage === "tr" && "Çerez Politikası"}
              </Button>
            </div>

            <LanguageSwitcher
              currentLang={selectedLanguage}
              onLanguageChange={handleLanguageChange}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="bg-white shadow-xl rounded-2xl overflow-hidden">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-primary/10 to-blue-600/10 p-8 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {selectedLanguage === "en" && "Your Privacy Matters"}
                  {selectedLanguage === "pl" && "Twoja Prywatność Jest Ważna"}
                  {selectedLanguage === "tr" && "Gizliliğiniz Önemlidir"}
                </h2>
                <p className="text-gray-600">
                  {selectedLanguage === "en" && "Metropolitan Food Group sp. z o.o."}
                  {selectedLanguage === "pl" && "Metropolitan Food Group sp. z o.o."}
                  {selectedLanguage === "tr" && "Metropolitan Food Group sp. z o.o."}
                </p>
              </div>
              <Shield className="h-16 w-16 text-primary/20" />
            </div>
          </div>

          {/* Content Area */}
          <div className="p-8">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="space-y-4 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto" />
                  <p className="text-gray-500">
                    {selectedLanguage === "en" && "Loading privacy policy..."}
                    {selectedLanguage === "pl" && "Ładowanie polityki prywatności..."}
                    {selectedLanguage === "tr" && "Gizlilik politikası yükleniyor..."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="prose prose-gray max-w-none">
                {formatContent(content)}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {selectedLanguage === "en" && "© 2025 Metropolitan Food Group. All rights reserved."}
                {selectedLanguage === "pl" && "© 2025 Metropolitan Food Group. Wszelkie prawa zastrzeżone."}
                {selectedLanguage === "tr" && "© 2025 Metropolitan Food Group. Tüm hakları saklıdır."}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="flex items-center space-x-1"
              >
                <span>
                  {selectedLanguage === "en" && "Back to top"}
                  {selectedLanguage === "pl" && "Powrót do góry"}
                  {selectedLanguage === "tr" && "Yukarı dön"}
                </span>
                <ChevronRight className="h-4 w-4 rotate-[-90deg]" />
              </Button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default PrivacyPolicy;