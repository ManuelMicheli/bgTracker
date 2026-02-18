import { Header } from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';

export default function InsightsPage() {
  return (
    <>
      <Header title="Insights" />
      <div className="p-6">
        <Card>
          <CardContent>
            <p className="text-muted-foreground">
              L&apos;advisor finanziario con analisi dei pattern di spesa e suggerimenti sarà
              disponibile nella Fase 5.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
