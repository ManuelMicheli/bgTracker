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

    return (
      <div
        key={cat.id}
        className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
      >
        {isEditing ? (
          <div className="flex flex-1 items-center gap-2">
            <input
              type="text"
              value={editValues.icon}
              onChange={(e) => setEditValues({ ...editValues, icon: e.target.value })}
              className="w-12 rounded border border-border bg-background px-2 py-1 text-center text-lg"
              maxLength={4}
            />
            <input
              type="text"
              value={editValues.name}
              onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
              className="flex-1 rounded border border-border bg-background px-2 py-1 text-sm"
            />
            <input
              type="color"
              value={editValues.color}
              onChange={(e) => setEditValues({ ...editValues, color: e.target.value })}
              className="h-8 w-8 cursor-pointer rounded border-none"
            />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg text-lg"
              style={{ backgroundColor: cat.color + '20' }}
            >
              {cat.icon}
            </span>
            <span className="font-medium">{cat.name}</span>
            <Badge>{cat._count.transactions} transazioni</Badge>
          </div>
        )}

        <div className="flex items-center gap-1">
          {isEditing ? (
            <>
              <Button size="sm" variant="primary" onClick={() => handleSaveEdit(cat.id)}>
                Salva
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                Annulla
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="ghost" onClick={() => startEdit(cat)}>
                Modifica
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleDelete(cat.id)}
                disabled={deleting === cat.id || cat._count.transactions > 0}
                title={
                  cat._count.transactions > 0
                    ? 'Non puoi eliminare una categoria con transazioni'
                    : undefined
                }
              >
                {deleting === cat.id ? '...' : 'Elimina'}
              </Button>
            </>
          )}
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
