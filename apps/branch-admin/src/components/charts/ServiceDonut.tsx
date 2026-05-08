'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface Slice { name: string; value: number; }

const COLORS = ['#C9A87C', '#D9B8B5', '#DCD6DD', '#8B837C', '#B5956A'];

const SEED: Slice[] = [
  { name: 'Combo VIO',       value: 32 },
  { name: 'Triệt toàn thân', value: 18 },
  { name: 'Mặt',             value: 12 },
  { name: 'Yomogi',          value: 8 },
  { name: 'Khác',            value: 14 }
];

export default function ServiceDonut({ data }: { data?: Slice[] }) {
  const slices = data ?? SEED;
  const total = slices.reduce((s, x) => s + x.value, 0);

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={slices} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
          {slices.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v: number, name: string) => [`${v} (${total > 0 ? Math.round((v / total) * 100) : 0}%)`, name]}
          contentStyle={{ borderRadius: 12, border: '1px solid #F4EFEA', fontSize: 12 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
