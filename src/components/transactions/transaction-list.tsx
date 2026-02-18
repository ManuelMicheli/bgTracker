'use client';

import { useRouter } from 'next/navigation';
import { TransactionTable } from './transaction-table';
import { toast } from 'sonner';

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

interface TransactionListProps {
  transactions: Transaction[];
  total: number;
  page: number;
  pageSize: number;
}

export function TransactionList({ transactions, total, page, pageSize }: TransactionListProps) {
  const router = useRouter();
  const totalPages = Math.ceil(total / pageSize);

  async function handleDelete(id: string) {
    if (!confirm('Eliminare questa transazione?')) return;

    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Transazione eliminata');
      router.refresh();
    } catch {
      toast.error('Errore nell\'eliminazione');
    }
  }

  return (
    <div>
      <TransactionTable transactions={transactions} onDelete={handleDelete} />
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Pagina {page} di {totalPages} ({total} transazioni)
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <button
                onClick={() => router.push(`/transactions?page=${page - 1}`)}
                className="rounded-lg border border-border px-3 py-1 hover:bg-muted"
              >
                Precedente
              </button>
            )}
            {page < totalPages && (
              <button
                onClick={() => router.push(`/transactions?page=${page + 1}`)}
                className="rounded-lg border border-border px-3 py-1 hover:bg-muted"
              >
                Successiva
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
