"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, ChevronRight, ChevronDown, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLegal } from "@/hooks/api/use-legal";
import { useTranslation } from "react-i18next";

type LegalType = "privacy-policy" | "cookie-policy" | "terms-of-service";

export default function LegalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, i18n } = useTranslation();

  const [selectedType, setSelectedType] = useState<LegalType>(() => {
    const type = searchParams.get("type");
    if (type === "privacy-policy" || type === "cookie-policy" || type === "terms-of-service") {
      return type;
    }
    return "privacy-policy";
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // i18n.language "tr-TR" formatında geliyor, sadece ilk 2 karakteri al
  const language = ((i18n.language || "tr").split("-")[0]) as "tr" | "en" | "pl";
  const { data: legalData, isLoading } = useLegal(selectedType, language);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(Math.min(progress, 100));
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleTypeChange = (type: LegalType) => {
    setSelectedType(type);
    router.push(`/legal?type=${type}`, { scroll: false });
    setIsDropdownOpen(false);
  };

  const formatContent = (text: string) => {
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
            <p key={elements.length} className="mb-4 text-muted-foreground leading-relaxed">
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
                <span className="text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
        );
        listItems = [];
      }
    };

    lines.forEach((line, index) => {
      if (index < 2) return;

      if (line.startsWith("### ")) {
        processSection();
        processList();
        elements.push(
          <h3 key={elements.length} className="text-xl font-semibold mb-3 mt-6">
            {line.substring(4)}
          </h3>
        );
      } else if (line.startsWith("## ")) {
        processSection();
        processList();
        elements.push(
          <h2 key={elements.length} className="text-2xl font-bold mb-4 mt-8 pb-2 border-b">
            {line.substring(3)}
          </h2>
        );
      } else if (line.startsWith("# ")) {
        processSection();
        processList();
        elements.push(
          <h1 key={elements.length} className="text-3xl font-bold mb-6">
            {line.substring(2)}
          </h1>
        );
      } else if (line.trim().startsWith("-") || line.trim().startsWith("•")) {
        processSection();
        inList = true;
        const item = line.trim().substring(1).trim();
        if (item) listItems.push(item);
      } else if (line.trim().match(/^\d+\./)) {
        processSection();
        inList = true;
        const item = line.trim().replace(/^\d+\./, "").trim();
        if (item) listItems.push(item);
      } else if (line.includes("**")) {
        processSection();
        processList();
        const parts = line.split("**");
        const formatted: JSX.Element[] = [];
        parts.forEach((part, idx) => {
          if (idx % 2 === 1) {
            formatted.push(<strong key={idx} className="font-semibold">{part}</strong>);
          } else if (part) {
            formatted.push(<span key={idx}>{part}</span>);
          }
        });
        elements.push(
          <p key={elements.length} className="mb-4 text-muted-foreground leading-relaxed">
            {formatted}
          </p>
        );
      } else if (line.trim() === "") {
        if (inList) {
          processList();
          inList = false;
        } else {
          processSection();
        }
      } else if (line.trim()) {
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

  const getTitle = (type: LegalType) => {
    const titles = {
      "privacy-policy": t("legal.privacy_policy"),
      "cookie-policy": t("legal.cookie_policy"),
      "terms-of-service": t("legal.terms_of_service"),
    };
    return titles[type];
  };

  const getHeroTitle = (type: LegalType) => {
    const titles = {
      "privacy-policy": t("legal.privacy_hero_title"),
      "cookie-policy": t("legal.cookie_hero_title"),
      "terms-of-service": t("legal.terms_hero_title"),
    };
    return titles[type];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-muted">
        <div
          className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="sticky top-1 z-40 bg-background/95 backdrop-blur-sm border-b shadow-sm">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            {/* Mobile: Dropdown */}
            <div className="sm:hidden flex-1">
              <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-between"
                  >
                    <span className="font-medium text-primary">
                      {getTitle(selectedType)}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[calc(100vw-2rem)] sm:w-56">
                  <DropdownMenuRadioGroup
                    value={selectedType}
                    onValueChange={(value) => handleTypeChange(value as LegalType)}
                  >
                    {(["privacy-policy", "terms-of-service", "cookie-policy"] as LegalType[]).map((type) => (
                      <DropdownMenuRadioItem key={type} value={type}>
                        {getTitle(type)}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Desktop: Tabs */}
            <div className="hidden sm:flex items-center space-x-4">
              {(["privacy-policy", "terms-of-service", "cookie-policy"] as LegalType[]).map((type) => (
                <Button
                  key={type}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleTypeChange(type)}
                  disabled={type === selectedType}
                  className={type === selectedType ? "text-primary font-semibold" : ""}
                >
                  {getTitle(type)}
                </Button>
              ))}
            </div>

            {/* Language Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="ml-2">
                  <Globe className="h-4 w-4 mr-2" />
                  {language.toUpperCase()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuRadioGroup
                  value={language}
                  onValueChange={(value) => i18n.changeLanguage(value)}
                >
                  <DropdownMenuRadioItem value="tr">
                    Türkçe
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="en">
                    English
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="pl">
                    Polski
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="bg-card shadow-xl rounded-2xl overflow-hidden">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-8 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">
                  {getHeroTitle(selectedType)}
                </h2>
                <p className="text-muted-foreground">
                  Metropolitan Food Group sp. z o.o.
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
                  <p className="text-muted-foreground">
                    {t("legal.loading")}
                  </p>
                </div>
              </div>
            ) : legalData ? (
              <div className="prose prose-gray dark:prose-invert max-w-none">
                {formatContent(legalData.content)}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground">{t("legal.error")}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-muted/50 px-8 py-6 border-t">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {t("legal.copyright")}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="flex items-center space-x-1"
              >
                <span>{t("legal.back_to_top")}</span>
                <ChevronRight className="h-4 w-4 rotate-[-90deg]" />
              </Button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}