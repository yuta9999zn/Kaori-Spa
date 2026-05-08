import type { Locale } from '@/i18n/routing';

export function formatPrice(amount: number, locale: Locale = 'vi') {
  try {
    return new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : locale, {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(amount);
  } catch {
    return amount.toLocaleString('vi-VN') + ' ₫';
  }
}

export function pickText<L extends string>(
  text: Partial<Record<L, string>> & { vi: string },
  locale: L
): string {
  return text[locale] ?? text.vi;
}
