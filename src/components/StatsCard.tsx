import { LucideIcon } from 'lucide-react';
import PremiumBadge from './PremiumBadge';

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtext?: string;
  isPremium?: boolean;
  iconColor?: string;
  gradientFrom?: string;
  gradientTo?: string;
}

export default function StatsCard({
  icon: Icon,
  label,
  value,
  subtext,
  isPremium = false,
  iconColor = 'text-primary-600',
  gradientFrom = 'from-primary-50',
  gradientTo = 'to-purple-50',
}: StatsCardProps) {
  return (
    <div className="bg-white border-2 border-slate-200 rounded-xl p-6 card-hover animate-scale-in shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg bg-gradient-to-br ${gradientFrom} ${gradientTo} border border-slate-200`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        {isPremium && <PremiumBadge size="sm" />}
      </div>

      <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-bold text-primary-950 mb-1">{value}</p>
      {subtext && <p className="text-xs text-slate-600 font-medium">{subtext}</p>}
    </div>
  );
}
