'use client';

import { useRouter } from 'next/navigation';
import { BudgetCard } from './budget-card';
import { toast } from 'sonner';

interface BudgetItem {
  id: string;
  amount: number;
  spent: number;
  remaining: number;
  percentage: number;
  category: { id: string; name: string; icon: string; color: string };
}

export function BudgetList({ budgets }: { budgets: BudgetItem[] }) {
  const router = useRouter();

  async function handleDelete(id: string) {
    if (!confirm('Eliminare questo budget?')) return;

    try {
      const res = await fetch(`/api/budgets/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Budget eliminato');
      router.refresh();
    } catch {
      toast.error('Errore nell\'eliminazione');
    }
  }

  if (budgets.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        Nessun budget impostato per questo mese. Aggiungine uno!
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {budgets.map((b) => (
        <BudgetCard key={b.id} {...b} onDelete={handleDelete} />
      ))}
    </div>
  );
}
