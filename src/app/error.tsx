'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6">
      <h2 className="text-2xl font-bold">Qualcosa è andato storto</h2>
      <p className="text-muted-foreground">{error.message || 'Si è verificato un errore.'}</p>
      <div className="flex gap-3">
        <Button onClick={reset}>Riprova</Button>
        <Button variant="secondary" onClick={() => router.push('/dashboard')}>
          Torna alla Dashboard
        </Button>
      </div>
    </div>
  );
}
