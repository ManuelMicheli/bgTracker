'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function AddCategoryForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    icon: '📦',
    color: '#6b7280',
    type: 'expense' as 'expense' | 'income',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;

    setSaving(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Errore nella creazione');
        return;
      }
      setForm({ name: '', icon: '📦', color: '#6b7280', type: 'expense' });
      setOpen(false);
      router.refresh();
    } catch {
      alert('Errore nella creazione');
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        + Nuova categoria
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-border p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Nome"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Es. Viaggi"
          required
        />
        <div className="flex gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Icona</label>
            <input
              type="text"
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
              className="flex h-10 w-14 rounded-lg border border-border bg-background text-center text-lg focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              maxLength={4}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Colore</label>
            <input
              type="color"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              className="h-10 w-14 cursor-pointer rounded-lg border border-border"
            />
          </div>
          <div className="flex-1 space-y-1.5">
            <label className="text-sm font-medium text-foreground">Tipo</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as 'expense' | 'income' })}
              className="flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="expense">Uscita</option>
              <option value="income">Entrata</option>
            </select>
          </div>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? 'Salvataggio...' : 'Aggiungi'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Annulla
        </Button>
      </div>
    </form>
  );
}
