import { Header } from '@/components/layout/header';
import { Card, CardContent, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  return (
    <>
      <Header title="Dashboard" />
      <div className="p-6">
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardTitle>Saldo Attuale</CardTitle>
            <CardContent>
              <p className="mt-2 text-3xl font-bold text-success">--</p>
              <p className="text-sm text-muted-foreground">In arrivo nella Fase 4</p>
            </CardContent>
          </Card>
          <Card>
            <CardTitle>Spese del Mese</CardTitle>
            <CardContent>
              <p className="mt-2 text-3xl font-bold text-danger">--</p>
              <p className="text-sm text-muted-foreground">In arrivo nella Fase 4</p>
            </CardContent>
          </Card>
          <Card>
            <CardTitle>Budget Residuo</CardTitle>
            <CardContent>
              <p className="mt-2 text-3xl font-bold text-primary">--</p>
              <p className="text-sm text-muted-foreground">In arrivo nella Fase 4</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
