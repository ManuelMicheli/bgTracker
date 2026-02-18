import { cn } from '@/lib/utils';
import type { SuggestionSeverity } from '@/lib/insights/suggestions';

interface SuggestionCardProps {
  icon: string;
  title: string;
  description: string;
  severity: SuggestionSeverity;
}

const severityStyles: Record<SuggestionSeverity, string> = {
  info: 'border-l-primary bg-primary/5',
  warning: 'border-l-warning bg-warning/5',
  danger: 'border-l-danger bg-danger/5',
  success: 'border-l-success bg-success/5',
};

export function SuggestionCard({ icon, title, description, severity }: SuggestionCardProps) {
  return (
    <div className={cn('rounded-lg border-l-4 p-4', severityStyles[severity])}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}
