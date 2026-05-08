'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Filter, Clock, Repeat } from 'lucide-react';
import { Link } from '@/i18n/routing';
import type { Locale } from '@/i18n/routing';
import { services } from '@/data/services';
import type { Gender, Region } from '@/data/types';
import { pickText, formatPrice } from '@/lib/format';
import { cn } from '@/lib/cn';

const genderFilters: Array<{ key: Gender | 'all'; label: 'filterAll' | 'filterMen' | 'filterWomen' | 'filterUnisex' }> = [
  { key: 'all', label: 'filterAll' },
  { key: 'female', label: 'filterWomen' },
  { key: 'male', label: 'filterMen' },
  { key: 'unisex', label: 'filterUnisex' }
];

const regionFilters: Array<{ key: Region | 'all'; label: keyof Pick<Record<string, never>, never> | string }> = [
  { key: 'all', label: 'filterAll' },
  { key: 'face', label: 'filterFace' },
  { key: 'arm', label: 'filterArm' },
  { key: 'chest', label: 'filterChest' },
  { key: 'belly', label: 'filterBelly' },
  { key: 'back', label: 'filterBack' },
  { key: 'vio', label: 'filterVio' },
  { key: 'leg', label: 'filterLeg' },
  { key: 'full_body', label: 'filterFullBody' },
  { key: 'beauty', label: 'filterBeauty' }
];

export default function ServicesGrid({ locale }: { locale: Locale }) {
  const t = useTranslations('services');
  const [gender, setGender] = useState<Gender | 'all'>('all');
  const [region, setRegion] = useState<Region | 'all'>('all');
  const [comboOnly, setComboOnly] = useState(false);

  const filtered = useMemo(() => {
    return services.filter(s => {
      if (gender !== 'all' && s.gender !== gender) return false;
      if (region !== 'all' && s.region !== region) return false;
      if (comboOnly && !s.isCombo) return false;
      return true;
    });
  }, [gender, region, comboOnly]);

  return (
    <>
      <div className="card-soft mb-8 flex flex-col gap-4 !p-5">
        <div className="flex items-center gap-2 text-brand-textmain">
          <Filter className="h-4 w-4" />
          <span className="text-xs uppercase tracking-widest text-brand-textmuted">Filter</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {genderFilters.map(f => (
            <FilterChip
              key={f.key}
              active={gender === f.key}
              onClick={() => setGender(f.key)}
            >
              {t(f.label)}
            </FilterChip>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {regionFilters.map(f => (
            <FilterChip
              key={f.key}
              active={region === f.key}
              onClick={() => setRegion(f.key as Region | 'all')}
            >
              {t(f.label as 'filterAll')}
            </FilterChip>
          ))}
          <FilterChip active={comboOnly} onClick={() => setComboOnly(c => !c)}>
            <Repeat className="h-3 w-3 mr-1" /> {t('filterCombo')}
          </FilterChip>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(s => (
          <article key={s.code} className="card-soft flex flex-col">
            <div className="flex items-center justify-between mb-2 text-[10px] uppercase tracking-widest">
              <span className="text-brand-gold">
                {t(`filter${s.gender === 'unisex' ? 'Unisex' : s.gender === 'male' ? 'Men' : 'Women'}` as 'filterAll')}
              </span>
              {s.isCombo && (
                <span className="rounded-full bg-brand-gold/10 px-2 py-0.5 text-brand-gold">
                  {t('filterCombo')}
                </span>
              )}
            </div>
            <h3 className="font-serif text-lg leading-tight text-brand-textmain mb-3 min-h-[3.25rem]">
              {pickText(s.name, locale)}
            </h3>
            <div className="mt-auto flex items-center justify-between text-sm">
              <span className="flex items-center gap-1 text-brand-textmuted">
                <Clock className="h-3.5 w-3.5" />
                {t('duration', { minutes: s.durationMin })}
                {s.sessions > 1 && <> · {t('sessions', { count: s.sessions })}</>}
              </span>
              <span className="font-medium text-brand-gold">
                {formatPrice(s.basePrice, locale)}
              </span>
            </div>
            <Link
              href={{ pathname: '/booking', query: { service: s.code } }}
              className="btn-primary mt-4 !py-2 !text-xs justify-center"
            >
              {t('bookNow')}
            </Link>
          </article>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-brand-textmuted py-12">—</p>
      )}
    </>
  );
}

function FilterChip({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1.5 text-xs transition',
        active
          ? 'border-brand-gold bg-brand-gold text-white'
          : 'border-brand-cream bg-white text-brand-textmuted hover:border-brand-gold hover:text-brand-textmain'
      )}
    >
      {children}
    </button>
  );
}
