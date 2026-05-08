import { branches } from '@/data/branches';
import { tenant } from '@/data/tenant';
import type { Locale } from '@/i18n/routing';
import { pickText } from '@/lib/format';

/**
 * Emit Schema.org LocalBusiness JSON-LD for each Natural Beauty branch.
 * Helps Google show the spa in local search & maps.
 */
export default function StructuredData({ locale }: { locale: Locale }) {
  const data = {
    '@context': 'https://schema.org',
    '@graph': branches.map(b => ({
      '@type': 'BeautySalon',
      '@id': `https://natural.kaorispa.io/#${b.code}`,
      name: pickText(b.name, locale),
      address: {
        '@type': 'PostalAddress',
        streetAddress: pickText(b.address, locale),
        addressLocality: 'Hanoi',
        addressCountry: 'VN'
      },
      geo: { '@type': 'GeoCoordinates', latitude: b.lat, longitude: b.lng },
      telephone: b.phone,
      url: `https://natural.kaorispa.io/${locale}/branches`,
      openingHours: 'Mo-Sa 09:00-20:00,Su 10:00-19:00',
      priceRange: '50.000₫ - 15.000.000₫',
      brand: { '@type': 'Brand', name: tenant.name }
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
