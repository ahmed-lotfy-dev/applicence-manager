import type { Stats } from '../../types/dashboard';
import { Card, CardContent } from '../ui/card';

interface StatsCardsProps {
  stats: Stats;
}

const ITEMS = [
  { key: 'total', label: 'Total', tone: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  { key: 'active', label: 'Active', tone: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { key: 'pending', label: 'Pending', tone: 'text-amber-400', bg: 'bg-amber-500/10' },
  { key: 'revoked', label: 'Revoked', tone: 'text-rose-400', bg: 'bg-rose-500/10' },
] as const;

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-6">
      {ITEMS.map((item) => (
        <Card key={item.key} className={`${item.bg} border-white/5 shadow-soft ring-1 ring-white/5`}>
          <CardContent className="py-8 flex flex-col items-center text-center">
            <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500 mb-2">{item.label}</p>
            <p className={`text-4xl font-bold tracking-tight ${item.tone}`}>{stats[item.key]}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
