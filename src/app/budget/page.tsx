import { Header } from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';

export default function BudgetPage() {
  return (
    <>
      <Header title="Budget" />
      <div className="p-6">
        <Card>
          <CardContent>
            <p className="text-muted-foreground">
              La gestione dei budget mensili e annuali per categoria sarà disponibile nella Fase 4.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
