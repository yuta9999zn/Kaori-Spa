/**
 * Currency-aware formatting helpers. Reads the current org's primary
 * currency from `kaori.activeBranch` data (loaded via /v1/me/branches at
 * boot) so the same component works for VN VND, JP JPY, EN USD shops.
 */

const ORG_CURRENCY: string = (() => {
  if (typeof window === 'undefined') return 'VND';
  return window.localStorage.getItem('kaori.orgCurrency') ?? 'VND';
})();

const DECIMALS: Record<string, number> = {
  VND: 0, JPY: 0, KRW: 0,
  USD: 2, EUR: 2, CNY: 2, THB: 2
};

const SYMBOL: Record<string, string> = {
  VND: '₫', JPY: '¥', KRW: '₩', USD: '$', EUR: '€', CNY: '¥', THB: '฿'
};

export function formatMoney(amount: number, currency: string = ORG_CURRENCY) {
  try {
    return new Intl.NumberFormat(currency === 'VND' ? 'vi-VN' : 'en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: DECIMALS[currency] ?? 2
    }).format(amount);
  } catch {
    return amount.toLocaleString('vi-VN') + ' ' + (SYMBOL[currency] ?? currency);
  }
}

export function setOrgCurrency(code: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('kaori.orgCurrency', code);
}

export function currentCurrency() { return ORG_CURRENCY; }

export function symbolFor(code: string) {
  return SYMBOL[code] ?? code;
}
