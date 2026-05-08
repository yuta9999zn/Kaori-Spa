import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const locales = ['vi', 'en', 'ja', 'zh', 'ko'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'vi';

export const localeLabels: Record<Locale, { native: string; flag: string }> = {
  vi: { native: 'Tiếng Việt', flag: '🇻🇳' },
  en: { native: 'English', flag: '🇺🇸' },
  ja: { native: '日本語', flag: '🇯🇵' },
  zh: { native: '中文', flag: '🇨🇳' },
  ko: { native: '한국어', flag: '🇰🇷' }
};

export const routing = defineRouting({
  locales: [...locales],
  defaultLocale,
  localePrefix: 'always'
});

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
