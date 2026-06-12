import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export default function ModernStatsCard({
  title,
  value,
  change,
  changeLabel = 'vs last month',
  icon: Icon,
  iconColor = 'text-primary',
  iconBg = 'bg-primary/10',
  description,
  trend = 'neutral',
}: StatsCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3" />;
      case 'down': return <TrendingDown className="h-3 w-3" />;
      default: return <Minus className="h-3 w-3" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-emerald-600 bg-emerald-50';
      case 'down': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20">
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      
      {/* Top bar accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/60 transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className={cn('p-3 rounded-xl transition-transform duration-300 group-hover:scale-110', iconBg)}>
            <Icon className={cn('h-6 w-6', iconColor)} />
          </div>
          
          {change !== undefined && (
            <div className={cn('flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', getTrendColor())}>
              {getTrendIcon()}
              <span>{Math.abs(change)}%</span>
            </div>
          )}
        </div>

        {/* Value */}
        <div className="space-y-1">
          <h3 className="text-3xl font-bold tracking-tight text-foreground">
            {value}
          </h3>
          <p className="text-sm font-medium text-muted-foreground">
            {title}
          </p>
        </div>

        {/* Footer - only show if there's actual change data or description */}
        {(description || change !== undefined) && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              {description || (
                <>
                  <span className={cn('font-medium', trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600')}>
                    {change >= 0 ? '+' : ''}{change}%
                  </span>
                  {' '}{changeLabel}
                </>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
