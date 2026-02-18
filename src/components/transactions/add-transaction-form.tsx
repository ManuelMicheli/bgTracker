'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  icon: string;
  type: string;
}

export function AddTransactionForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const filteredCategories = categories.filter((c) => c.type === type);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !description || !categoryId) {
      toast.error('Compila tutti i campi');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          description,
          type,
          categoryId,
          source: 'manual',
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Errore');
      }

      toast.success('Transazione aggiunta!');
      setAmount('');
      setDescription('');
      setCategoryId('');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore nel salvataggio');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardTitle>Nuova Transazione</CardTitle>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {/* Type toggle */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant={type === 'expense' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => { setType('expense'); setCategoryId(''); }}
          >
            💸 Spesa
          </Button>
          <Button
            type="button"
            variant={type === 'income' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => { setType('income'); setCategoryId(''); }}
          >
            💰 Entrata
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Importo (€)"
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
          <Input
            label="Descrizione"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="es. Spesa al supermercato"
          />
        </div>

        {/* Category selection */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">Categoria</label>
          <div className="flex flex-wrap gap-2">
            {filteredCategories.map((cat) => (
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
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? 'Salvataggio...' : 'Aggiungi Transazione'}
        </Button>
      </form>
    </Card>
  );
}
