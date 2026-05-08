'use client';

import { useState } from 'react';
import {
  ArrowRight, ArrowLeft, Check, Building, Users, MapPin,
  Sparkles, Flower2, Loader2, Plus, X, AlertCircle
} from 'lucide-react';
import { api, ApiError, ctx } from '@/lib/api';
import { cn } from '@/lib/cn';

type Step = 1 | 2 | 3 | 4 | 5;

interface BranchInput  { code: string; name: string; address: string; phone: string; }
interface UserInput    { email: string; fullName: string; role: 'BRANCH_MANAGER' | 'RECEPTIONIST' | 'THERAPIST'; branchCode: string; }
interface ServiceInput { code: string; name: string; durationMin: number; basePrice: number; }

const STEP_LABELS = ['Tổ chức', 'Chi nhánh', 'Nhân viên', 'Dịch vụ', 'Hoàn tất'];

/**
 * Self-service onboarding flow for a new tenant. Walks the owner through:
 *   1. Organization (name, slug, primary locale).
 *   2. Branches (at least 1, can add more).
 *   3. Initial team — branch managers + receptionists.
 *   4. Service catalog — start from the Natural Beauty preset or build custom.
 *   5. Recap + create everything in a single backend transaction
 *      via /v1/onboarding/finish.
 */
export default function OnboardingWizard() {
  const [step, setStep] = useState<Step>(1);

  const [org, setOrg] = useState({ name: '', slug: '', primaryLocale: 'vi' });
  const [branches, setBranches] = useState<BranchInput[]>([
    { code: '', name: '', address: '', phone: '' }
  ]);
  const [users, setUsers] = useState<UserInput[]>([
    { email: '', fullName: '', role: 'BRANCH_MANAGER', branchCode: '' }
  ]);
  const [seedFromPreset, setSeedFromPreset] = useState(true);
  const [extraServices, setExtraServices] = useState<ServiceInput[]>([]);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const canNext: Record<Step, boolean> = {
    1: !!org.name && !!org.slug,
    2: branches.length > 0 && branches.every(b => b.code && b.name && b.address),
    3: users.length > 0 && users.every(u => u.email && u.fullName && u.branchCode),
    4: seedFromPreset || extraServices.length > 0,
    5: true
  };

  const submit = async () => {
    setBusy(true); setError(null);
    try {
      await api('/v1/onboarding/finish', {
        method: 'POST',
        body: JSON.stringify({
          tenantId: ctx.tenantId,
          org, branches, users,
          seedFromPreset, services: extraServices
        })
      });
      setDone(true);
    } catch (e) { setError((e as ApiError).message); }
    finally { setBusy(false); }
  };

  if (done) {
    return (
      <div className="max-w-md mx-auto mt-12 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <Check className="h-8 w-8" />
        </div>
        <h1 className="font-serif text-2xl mb-2">Khởi tạo thành công!</h1>
        <p className="text-sm text-brand-textmuted mb-6">
          {org.name} đã sẵn sàng. Hãy mời nhân viên đăng nhập và bắt đầu nhận booking.
        </p>
        <a href="/" className="btn-primary">Vào dashboard</a>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-32">
      {/* Step indicator */}
      <ol className="flex items-center mb-8 gap-1">
        {STEP_LABELS.map((label, i) => {
          const idx = (i + 1) as Step;
          const active = step === idx;
          const stepDone = step > idx;
          return (
            <li key={label} className="flex items-center flex-1 last:flex-initial">
              <button
                type="button"
                onClick={() => idx <= step && setStep(idx)}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full text-xs font-medium transition flex-shrink-0',
                  active   ? 'bg-brand-gold text-white' :
                  stepDone ? 'bg-emerald-500 text-white' :
                             'bg-brand-cream text-brand-textmuted'
                )}
                aria-current={active ? 'step' : undefined}
              >
                {stepDone ? <Check className="h-4 w-4" /> : idx}
              </button>
              {i < STEP_LABELS.length - 1 && (
                <span className={cn('mx-2 h-0.5 flex-1', stepDone ? 'bg-emerald-500' : 'bg-brand-cream')} />
              )}
            </li>
          );
        })}
      </ol>

      <header className="mb-6">
        <h1 className="font-serif text-2xl sm:text-3xl text-brand-textmain flex items-center gap-2">
          <Flower2 className="h-6 w-6 text-brand-gold" />
          {STEP_LABELS[step - 1]}
        </h1>
      </header>

      <div className="card-soft space-y-4">
        {step === 1 && <OrgStep value={org} onChange={setOrg} />}
        {step === 2 && <BranchesStep value={branches} onChange={setBranches} />}
        {step === 3 && <UsersStep users={users} branches={branches} onChange={setUsers} />}
        {step === 4 && <ServicesStep
          seedFromPreset={seedFromPreset}
          onPreset={setSeedFromPreset}
          extras={extraServices}
          onExtras={setExtraServices}
        />}
        {step === 5 && (
          <Recap org={org} branches={branches} users={users}
            seedFromPreset={seedFromPreset} extras={extraServices} />
        )}
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div
        className="fixed bottom-0 left-0 right-0 border-t border-brand-cream bg-white/95 backdrop-blur p-4"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
      >
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          {step > 1 && (
            <button onClick={() => setStep(s => (s - 1) as Step)} className="btn-ghost">
              <ArrowLeft className="h-4 w-4" /> Quay lại
            </button>
          )}
          {step < 5 ? (
            <button onClick={() => setStep(s => (s + 1) as Step)}
              disabled={!canNext[step]}
              className="btn-primary flex-1 justify-center disabled:opacity-50">
              Tiếp <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={submit} disabled={busy}
              className="btn-primary flex-1 justify-center disabled:opacity-50">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Hoàn tất khởi tạo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function OrgStep({ value, onChange }: { value: { name: string; slug: string; primaryLocale: string }; onChange: (v: { name: string; slug: string; primaryLocale: string }) => void }) {
  return (
    <>
      <Field label="Tên tổ chức *">
        <input value={value.name} onChange={e => onChange({ ...value, name: e.target.value })} className="fi" />
      </Field>
      <Field label="Slug URL * (chữ thường, gạch ngang)">
        <input value={value.slug}
          onChange={e => onChange({ ...value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
          className="fi font-mono" placeholder="natural-beauty" />
      </Field>
      <Field label="Ngôn ngữ chính">
        <select value={value.primaryLocale} onChange={e => onChange({ ...value, primaryLocale: e.target.value })} className="fi">
          <option value="vi">🇻🇳 Tiếng Việt</option>
          <option value="en">🇺🇸 English</option>
          <option value="ja">🇯🇵 日本語</option>
          <option value="zh">🇨🇳 中文</option>
          <option value="ko">🇰🇷 한국어</option>
        </select>
      </Field>
      <FormStyles />
    </>
  );
}

function BranchesStep({ value, onChange }: { value: BranchInput[]; onChange: (v: BranchInput[]) => void }) {
  const update = (i: number, patch: Partial<BranchInput>) =>
    onChange(value.map((b, idx) => idx === i ? { ...b, ...patch } : b));
  return (
    <div className="space-y-4">
      {value.map((b, i) => (
        <div key={i} className="rounded-xl border border-brand-cream bg-brand-cream/20 p-4 relative">
          {value.length > 1 && (
            <button onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              className="absolute top-2 right-2 text-brand-textmuted hover:text-rose-600">
              <X className="h-4 w-4" />
            </button>
          )}
          <h3 className="font-medium mb-3 flex items-center gap-2"><MapPin className="h-4 w-4 text-brand-gold" /> Chi nhánh #{i + 1}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Mã *"><input value={b.code} onChange={e => update(i, { code: e.target.value })} className="fi font-mono" /></Field>
            <Field label="Tên *"><input value={b.name} onChange={e => update(i, { name: e.target.value })} className="fi" /></Field>
            <Field label="Địa chỉ *"><input value={b.address} onChange={e => update(i, { address: e.target.value })} className="fi" /></Field>
            <Field label="SĐT"><input value={b.phone} onChange={e => update(i, { phone: e.target.value })} className="fi" /></Field>
          </div>
        </div>
      ))}
      <button onClick={() => onChange([...value, { code: '', name: '', address: '', phone: '' }])}
        className="btn-ghost w-full justify-center">
        <Plus className="h-4 w-4" /> Thêm chi nhánh
      </button>
      <FormStyles />
    </div>
  );
}

function UsersStep({ users, branches, onChange }: { users: UserInput[]; branches: BranchInput[]; onChange: (v: UserInput[]) => void }) {
  const update = (i: number, patch: Partial<UserInput>) =>
    onChange(users.map((u, idx) => idx === i ? { ...u, ...patch } : u));
  return (
    <div className="space-y-4">
      {users.map((u, i) => (
        <div key={i} className="rounded-xl border border-brand-cream bg-brand-cream/20 p-4 relative">
          {users.length > 1 && (
            <button onClick={() => onChange(users.filter((_, idx) => idx !== i))}
              className="absolute top-2 right-2 text-brand-textmuted hover:text-rose-600">
              <X className="h-4 w-4" />
            </button>
          )}
          <h3 className="font-medium mb-3 flex items-center gap-2"><Users className="h-4 w-4 text-brand-gold" /> Nhân viên #{i + 1}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Họ tên *"><input value={u.fullName} onChange={e => update(i, { fullName: e.target.value })} className="fi" /></Field>
            <Field label="Email *"><input type="email" value={u.email} onChange={e => update(i, { email: e.target.value })} className="fi" /></Field>
            <Field label="Vai trò *">
              <select value={u.role} onChange={e => update(i, { role: e.target.value as 'BRANCH_MANAGER' })} className="fi">
                <option value="BRANCH_MANAGER">Quản lý chi nhánh</option>
                <option value="RECEPTIONIST">Lễ tân</option>
                <option value="THERAPIST">Kỹ thuật viên</option>
              </select>
            </Field>
            <Field label="Chi nhánh *">
              <select value={u.branchCode} onChange={e => update(i, { branchCode: e.target.value })} className="fi">
                <option value="">— Chọn —</option>
                {branches.map(b => <option key={b.code} value={b.code}>{b.code} · {b.name}</option>)}
              </select>
            </Field>
          </div>
        </div>
      ))}
      <button onClick={() => onChange([...users, { email: '', fullName: '', role: 'RECEPTIONIST', branchCode: branches[0]?.code ?? '' }])}
        className="btn-ghost w-full justify-center">
        <Plus className="h-4 w-4" /> Thêm nhân viên
      </button>
      <FormStyles />
    </div>
  );
}

function ServicesStep({ seedFromPreset, onPreset, extras, onExtras }: {
  seedFromPreset: boolean; onPreset: (v: boolean) => void;
  extras: ServiceInput[]; onExtras: (v: ServiceInput[]) => void;
}) {
  return (
    <>
      <div
        onClick={() => onPreset(!seedFromPreset)}
        className={cn(
          'cursor-pointer rounded-2xl border-2 p-4 transition',
          seedFromPreset ? 'border-brand-gold bg-brand-gold/5' : 'border-brand-cream'
        )}
      >
        <div className="flex items-start gap-3">
          <div className={cn(
            'flex h-5 w-5 items-center justify-center rounded border-2 mt-0.5',
            seedFromPreset ? 'bg-brand-gold border-brand-gold' : 'border-brand-cream'
          )}>
            {seedFromPreset && <Check className="h-3 w-3 text-white" />}
          </div>
          <div>
            <p className="font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-gold" />
              Dùng catalog mẫu Natural Beauty (47 dịch vụ)
            </p>
            <p className="text-xs text-brand-textmuted mt-1">
              Triệt lông nam/nữ, làm đẹp + giá khuyến nghị. Bạn có thể chỉnh sửa sau.
            </p>
          </div>
        </div>
      </div>

      <button onClick={() => onExtras([...extras, { code: '', name: '', durationMin: 30, basePrice: 0 }])}
        className="btn-ghost w-full justify-center">
        <Plus className="h-4 w-4" /> Thêm dịch vụ tùy chỉnh
      </button>
      {extras.length > 0 && (
        <div className="space-y-3">
          {extras.map((s, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-4">
              <input value={s.code} onChange={e => onExtras(extras.map((x, idx) => idx === i ? { ...x, code: e.target.value } : x))} placeholder="Mã" className="fi font-mono" />
              <input value={s.name} onChange={e => onExtras(extras.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} placeholder="Tên" className="fi" />
              <input type="number" value={s.durationMin} onChange={e => onExtras(extras.map((x, idx) => idx === i ? { ...x, durationMin: Number(e.target.value) } : x))} placeholder="Phút" className="fi" />
              <input type="number" value={s.basePrice} onChange={e => onExtras(extras.map((x, idx) => idx === i ? { ...x, basePrice: Number(e.target.value) } : x))} placeholder="Giá" className="fi" />
            </div>
          ))}
        </div>
      )}
      <FormStyles />
    </>
  );
}

function Recap({ org, branches, users, seedFromPreset, extras }: {
  org: { name: string; slug: string; primaryLocale: string };
  branches: BranchInput[];
  users: UserInput[];
  seedFromPreset: boolean;
  extras: ServiceInput[];
}) {
  return (
    <div className="space-y-4 text-sm">
      <Section icon={Building} title="Tổ chức">
        <p className="font-medium">{org.name}</p>
        <p className="text-xs text-brand-textmuted">/{org.slug} · {org.primaryLocale}</p>
      </Section>
      <Section icon={MapPin} title={`${branches.length} chi nhánh`}>
        <ul className="space-y-1">
          {branches.map((b, i) => (
            <li key={i} className="text-xs">{b.code} — {b.name} ({b.address})</li>
          ))}
        </ul>
      </Section>
      <Section icon={Users} title={`${users.length} thành viên`}>
        <ul className="space-y-1">
          {users.map((u, i) => (
            <li key={i} className="text-xs">{u.fullName} ({u.email}) · {u.role} @ {u.branchCode}</li>
          ))}
        </ul>
      </Section>
      <Section icon={Sparkles} title="Catalog">
        <p className="text-xs">{seedFromPreset ? '47 dịch vụ Natural Beauty preset' : 'Tự chọn từ đầu'}{extras.length > 0 && ` + ${extras.length} dịch vụ riêng`}</p>
      </Section>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: typeof Building; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-brand-cream bg-brand-cream/20 p-4">
      <h3 className="font-medium flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-brand-gold" /> {title}
      </h3>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-widest text-brand-textmuted mb-1">{label}</span>
      {children}
    </label>
  );
}

function FormStyles() {
  return (
    <style jsx global>{`
      .fi { width: 100%; border: 1px solid #f4efea; border-radius: 12px; padding: 8px 12px;
            font-size: 14px; background: #faf9f6; outline: none; transition: border 0.2s; }
      .fi:focus { border-color: #c9a87c; box-shadow: 0 0 0 3px rgba(201,168,124,0.1); }
    `}</style>
  );
}
