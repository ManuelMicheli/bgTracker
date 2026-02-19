'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function ResetData() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleReset() {
    setDeleting(true);
    try {
      const res = await fetch('/api/transactions/reset', { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        alert(`${data.data.deleted} transazioni eliminate.`);
        setConfirming(false);
        router.refresh();
      } else {
        alert(data.error || 'Errore');
      }
    } catch {
      alert('Errore nella cancellazione');
    } finally {
      setDeleting(false);
    }
  }

  if (!confirming) {
    return (
      <Button variant="danger" onClick={() => setConfirming(true)}>
        Azzera tutti i dati
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-danger/30 bg-danger/5 p-4">
      <p className="text-sm font-medium">
        Sei sicuro? Tutte le transazioni verranno eliminate. Azione irreversibile.
      </p>
      <div className="flex gap-2">
        <Button variant="danger" size="sm" onClick={handleReset} disabled={deleting}>
          {deleting ? 'Eliminazione...' : 'Conferma'}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
          Annulla
        </Button>
      </div>
    </div>
  );
}
