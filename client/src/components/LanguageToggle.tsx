import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const LanguageToggle = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    try {
      localStorage.setItem('satyacheck_lang', lng);
    } catch (e) {
      console.warn('Could not save language to localStorage', e);
    }
  };

  const getLanguageLabel = (lng: string) => {
    switch (lng) {
      case 'hi':
        return 'हिंदी';
      case 'hi-en':
        return 'Hinglish';
      case 'bn':
        return 'বাংলা';
      default:
        return 'English';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 border-[#2B2B2B] bg-[#161616] px-2.5 text-xs font-medium text-zinc-200 hover:border-zinc-500 hover:bg-[#222222] hover:text-white"
          aria-label={t('language.switch')}
        >
          <Languages className="h-3.5 w-3.5 text-zinc-300" />
          <span>{getLanguageLabel(i18n.language)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="border-[#2B2B2B] bg-[#1C1C1C] text-zinc-200 shadow-xl backdrop-blur-md">
        <DropdownMenuItem
          onClick={() => changeLanguage('en')}
          className={`cursor-pointer text-xs ${i18n.language === 'en' ? 'bg-[#282828] font-semibold text-white' : 'hover:bg-[#222222]'}`}
        >
          🇺🇸 English
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => changeLanguage('hi')}
          className={`cursor-pointer text-xs ${i18n.language === 'hi' ? 'bg-[#282828] font-semibold text-white' : 'hover:bg-[#222222]'}`}
        >
          🇮🇳 हिंदी (Hindi)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => changeLanguage('hi-en')}
          className={`cursor-pointer text-xs ${i18n.language === 'hi-en' ? 'bg-[#282828] font-semibold text-white' : 'hover:bg-[#222222]'}`}
        >
          🇮🇳 Hinglish (Roman Hindi)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => changeLanguage('bn')}
          className={`cursor-pointer text-xs ${i18n.language === 'bn' ? 'bg-[#282828] font-semibold text-white' : 'hover:bg-[#222222]'}`}
        >
          🇧🇩 বাংলা (Bangla)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
