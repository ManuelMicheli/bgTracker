import { Card, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  type: string;
  category: { icon: string; name: string; color: string };
}

export function RecentTransactions({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return (
      <Card>
        <CardTitle>Ultime Transazioni</CardTitle>
        <p className="mt-4 text-sm text-muted-foreground">
          Nessuna transazione. Usa il bot Telegram per aggiungerne!
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <CardTitle>Ultime Transazioni</CardTitle>
      <div className="mt-4 space-y-3">
        {transactions.map((t) => (
          <div key={t.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg text-lg"
                style={{ backgroundColor: t.category.color + '20' }}
              >
                {t.category.icon}
              </span>
              <div>
                <p className="text-sm font-medium">{t.description}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(t.date).toLocaleDateString('it-IT', {
                    day: '2-digit',
                    month: 'short',
                  })}{' '}
                  · {t.category.name}
                </p>
              </div>
            </div>
            <span
              className={`text-sm font-semibold ${t.type === 'income' ? 'text-success' : 'text-danger'}`}
            >
              {t.type === 'income' ? '+' : '-'}
              {formatCurrency(t.amount)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
