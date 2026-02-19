'use client';

import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  type: string;
  source: string;
  notes: string | null;
  category: { id: string; name: string; icon: string; color: string };
}

interface TransactionTableProps {
  transactions: Transaction[];
  onDelete?: (id: string) => void;
}

export function TransactionTable({ transactions, onDelete }: TransactionTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-lg font-medium">Nessuna transazione</p>
        <p className="text-sm text-muted-foreground">
          Usa il bot Telegram o il form qui sotto per aggiungere transazioni.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile: card list */}
      <div className="space-y-2 md:hidden">
        {transactions.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-3 rounded-lg border border-border/50 p-3"
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base"
              style={{ backgroundColor: t.category.color + '20' }}
            >
              {t.category.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{t.description}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(t.date).toLocaleDateString('it-IT', {
                  day: '2-digit',
                  month: 'short',
                })}
                {' · '}
                {t.category.name}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span
                className={`text-sm font-semibold ${t.type === 'income' ? 'text-success' : 'text-danger'}`}
              >
                {t.type === 'income' ? '+' : '-'}
                {formatCurrency(t.amount)}
              </span>
              {onDelete && (
                <Button variant="ghost" size="sm" onClick={() => onDelete(t.id)}>
                  🗑️
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left text-sm text-muted-foreground">
              <th className="pb-3 font-medium">Data</th>
              <th className="pb-3 font-medium">Descrizione</th>
              <th className="pb-3 font-medium">Categoria</th>
              <th className="pb-3 font-medium">Fonte</th>
              <th className="pb-3 text-right font-medium">Importo</th>
              <th className="pb-3 text-right font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="border-b border-border/50 last:border-0">
                <td className="py-3 text-sm">
                  {new Date(t.date).toLocaleDateString('it-IT', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                <td className="py-3">
                  <p className="text-sm font-medium">{t.description}</p>
                  {t.notes && <p className="text-xs text-muted-foreground">{t.notes}</p>}
                </td>
                <td className="py-3">
                  <span className="flex items-center gap-1.5 text-sm">
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded text-xs"
                      style={{ backgroundColor: t.category.color + '20' }}
                    >
                      {t.category.icon}
                    </span>
                    {t.category.name}
                  </span>
                </td>
                <td className="py-3">
                  <Badge>
                    {t.source === 'telegram' ? '🤖 Bot' : t.source === 'csv' ? '📄 CSV' : '✏️ Manuale'}
                  </Badge>
                </td>
                <td className="py-3 text-right">
                  <span
                    className={`text-sm font-semibold ${t.type === 'income' ? 'text-success' : 'text-danger'}`}
                  >
                    {t.type === 'income' ? '+' : '-'}
                    {formatCurrency(t.amount)}
                  </span>
                </td>
                <td className="py-3 text-right">
                  {onDelete && (
                    <Button variant="ghost" size="sm" onClick={() => onDelete(t.id)}>
                      🗑️
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
