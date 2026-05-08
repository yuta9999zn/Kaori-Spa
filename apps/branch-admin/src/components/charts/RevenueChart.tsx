'use client';

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface DailyPoint { day: string; revenue: number; bookings: number; }

const SEED: DailyPoint[] = Array.from({ length: 14 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() - (13 - i));
  return {
    day: d.toISOString().slice(5, 10),
    revenue: 5_000_000 + Math.floor(Math.random() * 12_000_000),
    bookings: 15 + Math.floor(Math.random() * 25)
  };
});

function fmtMillion(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return String(n);
}

export default function RevenueChart({ data }: { data?: DailyPoint[] }) {
  const points = data ?? SEED;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={points} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#C9A87C" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#C9A87C" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F4EFEA" />
        <XAxis dataKey="day" tick={{ fill: '#8B837C', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={fmtMillion} tick={{ fill: '#8B837C', fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
        <Tooltip
          formatter={(v: number) => [`${(v / 1_000_000).toFixed(1)}M ₫`, 'Doanh thu']}
          contentStyle={{ borderRadius: 12, border: '1px solid #F4EFEA', fontSize: 12 }}
        />
        <Area
          type="monotone" dataKey="revenue"
          stroke="#C9A87C" strokeWidth={2}
          fill="url(#goldGrad)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
