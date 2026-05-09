import { getTranslations } from 'next-intl/server';
import type { SubNavItem } from './SubNav';

/**
 * Returns the SubNav items for a given top-level section. Each section's
 * tabs link to all sibling routes that exist as Phase A pages. Labels come
 * from the `subNav.<section>.<key>` namespace in the locale messages.
 */
export async function getSubNavItems(
  section: 'booking' | 'customer' | 'service' | 'staff' | 'report' | 'content' | 'inventory' | 'room'
): Promise<SubNavItem[]> {
  const t = await getTranslations(`subNav.${section}`);
  switch (section) {
    case 'booking':
      return [
        { href: '/booking', label: t('list') },
        { href: '/booking/calendar', label: t('calendar') },
        { href: '/booking/new', label: t('new') },
        { href: '/booking/waitlist', label: t('waitlist') },
        { href: '/booking/history', label: t('history') },
        { href: '/booking/rules', label: t('rules') },
        { href: '/booking/timeslots', label: t('timeslots') },
        { href: '/booking/settings', label: t('settings') },
        { href: '/booking/payment', label: t('payment') },
        { href: '/booking/reschedule', label: t('reschedule') },
        { href: '/booking/conflicts', label: t('conflicts') },
        { href: '/booking/analytics', label: t('analytics') }
      ];
    case 'customer':
      return [
        { href: '/customer', label: t('list') },
        { href: '/customer/new', label: t('new') },
        { href: '/customer/segments', label: t('segments') },
        { href: '/customer/loyalty', label: t('loyalty') },
        { href: '/customer/membership', label: t('membership') },
        { href: '/customer/health-notes', label: t('healthNotes') },
        { href: '/customer/communication', label: t('communication') },
        { href: '/customer/booking-history', label: t('bookingHistory') },
        { href: '/customer/payment-history', label: t('paymentHistory') },
        { href: '/customer/import-export', label: t('importExport') },
        { href: '/customer/analytics', label: t('analytics') }
      ];
    case 'service':
      return [
        // /service (parent) renders the live catalog list. /service/overview
        // is a separate dashboard-style page from the mockups.
        { href: '/service', label: t('catalog') },
        { href: '/service/overview', label: t('overview') },
        { href: '/service/list', label: t('list') },
        { href: '/service/new', label: t('new') },
        { href: '/service/categories', label: t('categories') },
        { href: '/service/packages', label: t('packages') },
        { href: '/service/content', label: t('content') },
        { href: '/service/availability', label: t('availability') },
        { href: '/service/import', label: t('import') }
      ];
    case 'staff':
      return [
        // /staff itself redirects to /staff/overview, so the overview tab
        // points directly at the real route.
        { href: '/staff/overview', label: t('overview') },
        { href: '/staff/list', label: t('list') },
        { href: '/staff/new', label: t('new') },
        { href: '/staff/profile', label: t('profile') },
        { href: '/staff/skills', label: t('skills') },
        { href: '/staff/performance', label: t('performance') },
        { href: '/staff/shifts', label: t('shifts') },
        { href: '/staff/attendance', label: t('attendance') },
        { href: '/staff/payroll', label: t('payroll') }
      ];
    case 'report':
      return [
        { href: '/report', label: t('main') },
        { href: '/report/branch', label: t('branch') },
        { href: '/report/daily', label: t('daily') },
        { href: '/report/staff-performance', label: t('staffPerformance') },
        { href: '/report/treatments', label: t('treatments') },
        { href: '/report/booking-analysis', label: t('bookingAnalysis') },
        { href: '/report/customer-analysis', label: t('customerAnalysis') }
      ];
    case 'content':
      return [
        { href: '/content', label: t('list') },
        { href: '/content/new', label: t('new') },
        { href: '/content/seo', label: t('seo') },
        { href: '/content/media', label: t('media') }
      ];
    case 'inventory':
      return [
        { href: '/inventory', label: t('main') },
        { href: '/inventory/in', label: t('in') },
        { href: '/inventory/out', label: t('out') }
      ];
    case 'room':
      return [
        { href: '/room', label: t('main') },
        { href: '/room/calendar', label: t('calendar') },
        { href: '/room/new', label: t('new') }
      ];
  }
}
