import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: { value: string; positive: boolean } | null;
  icon: string;
  variant?: 'default' | 'success' | 'danger' | 'primary';
}

const variantStyles = {
  default: 'text-foreground',
  success: 'text-success',
  danger: 'text-danger',
  primary: 'text-primary',
};

export function StatCard({ title, value, subtitle, trend, icon, variant = 'default' }: StatCardProps) {
  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className={cn('text-3xl font-bold', variantStyles[variant])}>{value}</p>
      <div className="flex items-center gap-2">
        {trend && (
          <span
            className={cn(
              'text-xs font-medium',
              trend.positive ? 'text-success' : 'text-danger',
            )}
          >
            {trend.positive ? '↗' : '↘'} {trend.value}
          </span>
        )}
        {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
      </div>
    </Card>
  );
}
