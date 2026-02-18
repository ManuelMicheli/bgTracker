'use client';

import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6">
      <h2 className="text-2xl font-bold">Qualcosa è andato storto</h2>
      <p className="text-muted-foreground">{error.message || 'Si è verificato un errore.'}</p>
      <Button onClick={reset}>Riprova</Button>
    </div>
  );
}
