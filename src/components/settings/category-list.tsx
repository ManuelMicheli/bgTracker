'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: string;
  isDefault: boolean;
  _count: { transactions: number };
}

export function CategoryList({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ name: string; icon: string; color: string }>({
    name: '',
    icon: '',
    color: '',
  });

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const incomeCategories = categories.filter((c) => c.type === 'income');

  async function handleDelete(id: string) {
    if (!confirm('Sei sicuro di voler eliminare questa categoria?')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Errore nella cancellazione');
        return;
      }
      router.refresh();
    } catch {
      alert('Errore nella cancellazione');
    } finally {
      setDeleting(null);
    }
  }

  function startEdit(cat: Category) {
    setEditing(cat.id);
    setEditValues({ name: cat.name, icon: cat.icon, color: cat.color });
  }

  async function handleSaveEdit(id: string) {
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editValues),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Errore nel salvataggio');
        return;
      }
      setEditing(null);
      router.refresh();
    } catch {
      alert('Errore nel salvataggio');
    }
  }

  function renderCategory(cat: Category) {
    const isEditing = editing === cat.id;
    const hasTransactions = cat._count.transactions > 0;

    if (isEditing) {
      return (
        <div
          key={cat.id}
          className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-3"
        >
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={editValues.icon}
              onChange={(e) => setEditValues({ ...editValues, icon: e.target.value })}
              className="w-12 rounded border border-border bg-background px-2 py-1.5 text-center text-lg"
              maxLength={4}
            />
            <input
              type="text"
              value={editValues.name}
              onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
              className="min-w-0 flex-1 rounded border border-border bg-background px-2 py-1.5 text-sm"
            />
            <input
              type="color"
              value={editValues.color}
              onChange={(e) => setEditValues({ ...editValues, color: e.target.value })}
              className="h-8 w-8 shrink-0 cursor-pointer rounded border-none"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="primary" onClick={() => handleSaveEdit(cat.id)}>
              Salva
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
              Annulla
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div
        key={cat.id}
        className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5"
      >
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg"
          style={{ backgroundColor: cat.color + '20' }}
        >
          {cat.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{cat.name}</p>
          <p className="text-xs text-muted-foreground">
            {cat._count.transactions} transazioni
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => startEdit(cat)}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Modifica"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
          </button>
          <button
            onClick={() => handleDelete(cat.id)}
            disabled={deleting === cat.id || hasTransactions}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger disabled:pointer-events-none disabled:opacity-30"
            aria-label="Elimina"
            title={hasTransactions ? 'Non puoi eliminare una categoria con transazioni' : 'Elimina'}
          >
            {deleting === cat.id ? (
              <span className="block h-4 w-4 text-center text-xs">...</span>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h4 className="mb-3 text-sm font-medium text-muted-foreground">Uscite</h4>
        <div className="space-y-2">{expenseCategories.map(renderCategory)}</div>
      </div>
      {incomeCategories.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-medium text-muted-foreground">Entrate</h4>
          <div className="space-y-2">{incomeCategories.map(renderCategory)}</div>
        </div>
      )}
    </div>
  );
}
