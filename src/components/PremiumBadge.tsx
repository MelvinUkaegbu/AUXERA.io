import { Crown } from 'lucide-react';

interface PremiumBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function PremiumBadge({ size = 'md', className = '' }: PremiumBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        bg-gradient-to-r from-gold-500 to-gold-600
        text-primary-950
        rounded-md font-bold
        relative overflow-hidden
        border border-gold-600
        ${sizeClasses[size]}
        ${className}
      `}
    >
      <span className="absolute inset-0 shimmer opacity-20" />
      <Crown className={`${iconSizes[size]} relative z-10`} />
      <span className="relative z-10">PREMIUM</span>
    </span>
  );
}
