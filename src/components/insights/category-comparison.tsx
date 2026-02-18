import { formatCurrency, cn } from '@/lib/utils';
import type { CategorySpending } from '@/lib/insights/analyzer';

export function CategoryComparison({ data }: { data: CategorySpending[] }) {
  if (data.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        Nessun dato per il confronto
      </p>
    );
  }

  // Find max for bar scaling
  const maxAmount = Math.max(...data.flatMap((d) => [d.currentMonth, d.previousMonth]));

  return (
    <div className="space-y-4">
      {data.map((cat) => (
        <div key={cat.categoryId}>
          <div className="mb-1 flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-medium">
              {cat.categoryIcon} {cat.categoryName}
            </span>
            <span
              className={cn(
                'text-xs font-medium',
                cat.change > 0 ? 'text-danger' : cat.change < 0 ? 'text-success' : 'text-muted-foreground',
              )}
            >
              {cat.change > 0 ? '+' : ''}
              {cat.previousMonth > 0 ? `${Math.round(cat.changePercent)}%` : 'nuovo'}
            </span>
          </div>
          {/* Dual bars */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-16 text-right text-xs text-muted-foreground">Attuale</span>
              <div className="h-4 flex-1 overflow-hidden rounded bg-muted">
                <div
                  className="h-full rounded"
                  style={{
                    width: maxAmount > 0 ? `${(cat.currentMonth / maxAmount) * 100}%` : '0%',
                    backgroundColor: cat.categoryColor,
                  }}
                />
              </div>
              <span className="w-20 text-right text-xs font-medium">
                {formatCurrency(cat.currentMonth)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-16 text-right text-xs text-muted-foreground">Prec.</span>
              <div className="h-4 flex-1 overflow-hidden rounded bg-muted">
                <div
                  className="h-full rounded opacity-40"
                  style={{
                    width: maxAmount > 0 ? `${(cat.previousMonth / maxAmount) * 100}%` : '0%',
                    backgroundColor: cat.categoryColor,
                  }}
                />
              </div>
              <span className="w-20 text-right text-xs text-muted-foreground">
                {formatCurrency(cat.previousMonth)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
