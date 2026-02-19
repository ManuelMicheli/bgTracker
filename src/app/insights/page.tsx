import { Header } from '@/components/layout/header';
import { Card, CardTitle } from '@/components/ui/card';
import { SuggestionCard } from '@/components/insights/suggestion-card';
import { CategoryComparison } from '@/components/insights/category-comparison';
import { formatCurrency } from '@/lib/utils';
import { requireAuth } from '@/lib/auth';
import * as insightService from '@/lib/services/insight.service';

export const dynamic = 'force-dynamic';

export default async function InsightsPage() {
  const user = await requireAuth();
  const { analysis, suggestions } = await insightService.getInsights(user.id);

  const { overview } = analysis;

  return (
    <>
      <Header title="Insights" />
      <div className="space-y-4 p-4 pb-20 md:space-y-6 md:p-6 md:pb-6">
        {/* Monthly overview comparison */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardTitle>{analysis.currentMonthLabel}</CardTitle>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Entrate</span>
                <span className="font-medium text-success">
                  {formatCurrency(overview.current.totalIncome)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Uscite</span>
                <span className="font-medium text-danger">
                  {formatCurrency(overview.current.totalExpenses)}
                </span>
              </div>
              <hr className="border-border" />
              <div className="flex justify-between text-sm">
                <span className="font-medium">Bilancio</span>
                <span
                  className={`font-bold ${overview.current.balance >= 0 ? 'text-success' : 'text-danger'}`}
                >
                  {formatCurrency(overview.current.balance)}
                </span>
              </div>
            </div>
          </Card>
          <Card>
            <CardTitle>{analysis.previousMonthLabel}</CardTitle>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Entrate</span>
                <span className="font-medium text-success">
                  {formatCurrency(overview.previous.totalIncome)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Uscite</span>
                <span className="font-medium text-danger">
                  {formatCurrency(overview.previous.totalExpenses)}
                </span>
              </div>
              <hr className="border-border" />
              <div className="flex justify-between text-sm">
                <span className="font-medium">Bilancio</span>
                <span
                  className={`font-bold ${overview.previous.balance >= 0 ? 'text-success' : 'text-danger'}`}
                >
                  {formatCurrency(overview.previous.balance)}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick stats */}
        {analysis.daysPassed >= 3 && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="text-center">
              <p className="text-sm text-muted-foreground">Spesa media giornaliera</p>
              <p className="text-2xl font-bold">{formatCurrency(analysis.averageDailyExpense)}</p>
            </Card>
            <Card className="text-center">
              <p className="text-sm text-muted-foreground">Proiezione fine mese</p>
              <p className="text-2xl font-bold">{formatCurrency(analysis.projectedMonthlyExpense)}</p>
            </Card>
            <Card className="text-center">
              <p className="text-sm text-muted-foreground">Abbonamenti</p>
              <p className="text-2xl font-bold">{formatCurrency(analysis.subscriptionTotal)}</p>
            </Card>
          </div>
        )}

        {/* Advisor suggestions */}
        <Card>
          <CardTitle>Advisor</CardTitle>
          <div className="mt-4 space-y-3">
            {suggestions.length > 0 ? (
              suggestions.map((s) => <SuggestionCard key={s.id} {...s} />)
            ) : (
              <p className="text-sm text-muted-foreground">
                Aggiungi più transazioni per ricevere consigli personalizzati.
              </p>
            )}
          </div>
        </Card>

        {/* Category comparison */}
        <Card>
          <CardTitle>
            Confronto per Categoria ({analysis.currentMonthLabel} vs {analysis.previousMonthLabel})
          </CardTitle>
          <div className="mt-4">
            <CategoryComparison data={analysis.byCategory} />
          </div>
        </Card>
      </div>
    </>
  );
}
