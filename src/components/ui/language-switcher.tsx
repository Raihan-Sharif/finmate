'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Check, Globe, Languages } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { startTransition } from 'react';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'default' | 'minimal' | 'icon-only';
  size?: 'sm' | 'default' | 'lg';
}

const languages = [
  { 
    code: 'en', 
    name: 'English', 
    nativeName: 'English', 
    flag: '🇺🇸',
    shortCode: 'EN'
  },
  { 
    code: 'bn', 
    name: 'Bangla', 
    nativeName: 'বাংলা', 
    flag: '🇧🇩',
    shortCode: 'বাং'
  },
] as const;

export function LanguageSwitcher({ 
  className, 
  variant = 'default', 
  size = 'default' 
}: LanguageSwitcherProps) {
  const t = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0];

  const switchLocale = (newLocale: string) => {
    startTransition(() => {
      // Navigate to the same pathname but with a different locale
      router.push(pathname, { locale: newLocale as any });
    });
  };

  if (variant === 'icon-only') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size={size}
            className={cn("relative", className)}
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center"
            >
              <Languages className="h-4 w-4" />
            </motion.div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <div className="p-2">
            <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
              {t('language')}
            </div>
            {languages.map((language) => (
              <DropdownMenuItem
                key={language.code}
                onClick={() => switchLocale(language.code)}
                className={cn(
                  "flex items-center justify-between cursor-pointer rounded-md px-2 py-2 transition-colors",
                  locale === language.code && "bg-primary/10 text-primary"
                )}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-base">{language.flag}</span>
                  <span className="font-medium">{language.nativeName}</span>
                </div>
                {locale === language.code && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <Check className="h-4 w-4 text-primary" />
                  </motion.div>
                )}
              </DropdownMenuItem>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === 'minimal') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size={size}
            className={cn("h-auto p-2", className)}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-1"
            >
              <span className="text-sm font-medium">{currentLanguage.shortCode}</span>
              <span className="text-base">{currentLanguage.flag}</span>
            </motion.div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <div className="p-2">
            <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
              {t('language')}
            </div>
            {languages.map((language) => (
              <DropdownMenuItem
                key={language.code}
                onClick={() => switchLocale(language.code)}
                className={cn(
                  "flex items-center justify-between cursor-pointer rounded-md px-2 py-2 transition-colors",
                  locale === language.code && "bg-primary/10 text-primary"
                )}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-base">{language.flag}</span>
                  <span className="font-medium">{language.nativeName}</span>
                </div>
                {locale === language.code && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <Check className="h-4 w-4 text-primary" />
                  </motion.div>
                )}
              </DropdownMenuItem>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Default variant
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={size}
          className={cn("justify-start space-x-2", className)}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2"
          >
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline-block font-medium">
              {currentLanguage.nativeName}
            </span>
            <span className="text-base">{currentLanguage.flag}</span>
          </motion.div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="p-2">
          <div className="flex items-center space-x-2 px-2 py-1 mb-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t('language')}
            </span>
          </div>
          {languages.map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => switchLocale(language.code)}
              className={cn(
                "flex items-center justify-between cursor-pointer rounded-md px-2 py-3 transition-all duration-200",
                locale === language.code 
                  ? "bg-gradient-to-r from-primary/10 to-primary/5 text-primary border-r-2 border-primary" 
                  : "hover:bg-gradient-to-r hover:from-muted/80 hover:to-muted hover:text-foreground"
              )}
            >
              <div className="flex items-center space-x-3">
                <motion.span 
                  className="text-lg"
                  whileHover={{ scale: 1.2, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {language.flag}
                </motion.span>
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{language.nativeName}</span>
                  <span className="text-xs text-muted-foreground">{language.name}</span>
                </div>
              </div>
              {locale === language.code && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20"
                >
                  <Check className="h-3 w-3 text-primary" />
                </motion.div>
              )}
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}