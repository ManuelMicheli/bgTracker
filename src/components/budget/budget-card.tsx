'use client';

import { formatCurrency, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface BudgetCardProps {
  id: string;
  amount: number;
  spent: number;
  remaining: number;
  percentage: number;
  category: { name: string; icon: string; color: string };
  onDelete: (id: string) => void;
}

export function BudgetCard({ id, amount, spent, remaining, percentage, category, onDelete }: BudgetCardProps) {
  const isOver = percentage >= 100;
  const isWarning = percentage >= 80 && !isOver;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg text-base"
            style={{ backgroundColor: category.color + '20' }}
          >
            {category.icon}
          </span>
          <span className="font-medium">{category.name}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => onDelete(id)}>
          ✕
        </Button>
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="mb-1 flex justify-between text-sm">
          <span className="text-muted-foreground">
            {formatCurrency(spent)} / {formatCurrency(amount)}
          </span>
          <span
            className={cn(
              'font-medium',
              isOver ? 'text-danger' : isWarning ? 'text-warning' : 'text-success',
            )}
          >
            {Math.round(percentage)}%
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              isOver ? 'bg-danger' : isWarning ? 'bg-warning' : 'bg-success',
            )}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>

      <p
        className={cn(
          'mt-2 text-sm',
          isOver ? 'text-danger' : 'text-muted-foreground',
        )}
      >
        {isOver
          ? `Sforato di ${formatCurrency(Math.abs(remaining))}`
          : `Rimangono ${formatCurrency(remaining)}`}
      </p>
    </div>
  );
}
