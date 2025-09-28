import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';

const languages = {
  pl: { name: 'PL' },
  en: { name: 'EN' },
  tr: { name: 'TR' },
};

interface LanguageSwitcherProps {
  currentLang: string;
  onLanguageChange: (lang: string) => void;
}

export const LanguageSwitcher = ({ currentLang, onLanguageChange }: LanguageSwitcherProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          {languages[currentLang as keyof typeof languages]?.name}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="p-1 space-y-0.5 min-w-[60px]">
        {Object.entries(languages).map(([code, lang]) => (
          <DropdownMenuItem 
            key={code} 
            onClick={() => onLanguageChange(code)}
            className={`py-1.5 px-2 text-sm rounded cursor-pointer ${currentLang === code ? 'bg-accent' : ''}`}
          >
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};