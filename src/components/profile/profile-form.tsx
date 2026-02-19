'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, User } from 'lucide-react';

export function ProfileForm({ defaultName }: { defaultName: string }) {
  const [name, setName] = useState(defaultName);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        throw new Error('Errore nell\'aggiornamento');
      }

      toast.success('Profilo aggiornato con successo!');
    } catch {
      toast.error('Errore nell\'aggiornamento del profilo');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <form onSubmit={handleUpdateProfile} className="space-y-4">
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium">
          <User className="h-4 w-4" />
          Nome
        </label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Il tuo nome"
        />
      </div>
      <Button type="submit" disabled={isUpdating}>
        {isUpdating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Salvataggio...
          </>
        ) : (
          'Salva Modifiche'
        )}
      </Button>
    </form>
  );
}
