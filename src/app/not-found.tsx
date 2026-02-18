import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6">
      <h2 className="text-2xl font-bold">Pagina non trovata</h2>
      <p className="text-muted-foreground">La pagina che cerchi non esiste.</p>
      <Link href="/dashboard">
        <Button>Torna alla Dashboard</Button>
      </Link>
    </div>
  );
}
