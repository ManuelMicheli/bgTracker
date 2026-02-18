'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface AddBudgetFormProps {
  categories: Category[];
  existingCategoryIds: string[];
}

export function AddBudgetForm({ categories, existingCategoryIds }: AddBudgetFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const availableCategories = categories.filter(
    (c) => !existingCategoryIds.includes(c.id),
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !categoryId) {
      toast.error('Seleziona categoria e importo');
      return;
    }

    setLoading(true);
    const now = new Date();
    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          period: 'monthly',
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          categoryId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Errore');
      }

      toast.success('Budget aggiunto!');
      setAmount('');
      setCategoryId('');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore nel salvataggio');
    } finally {
      setLoading(false);
    }
  }

  if (availableCategories.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Tutte le categorie hanno già un budget impostato per questo mese.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-wrap gap-2">
        {availableCategories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategoryId(cat.id)}
            className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
              categoryId === cat.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border hover:border-primary/50'
            }`}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>
      <Input
        type="number"
        step="0.01"
        min="1"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Limite €"
        className="w-32"
      />
      <Button type="submit" size="md" disabled={loading}>
        {loading ? '...' : 'Aggiungi'}
      </Button>
    </form>
  );
}
