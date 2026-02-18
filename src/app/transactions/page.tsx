import { Header } from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';

export default function TransactionsPage() {
  return (
    <>
      <Header title="Transazioni" />
      <div className="p-6">
        <Card>
          <CardContent>
            <p className="text-muted-foreground">
              La lista delle transazioni e l&apos;importazione via Telegram Bot saranno disponibili
              nella Fase 3.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
