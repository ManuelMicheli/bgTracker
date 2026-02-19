import { Header } from '@/components/layout/header';
import { StatCard } from '@/components/dashboard/stat-card';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { ExpensePie } from '@/components/charts/expense-pie';
import { Card, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { requireAuth } from '@/lib/auth';
import * as transactionService from '@/lib/services/transaction.service';
import * as budgetService from '@/lib/services/budget.service';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await requireAuth();
  
  const [stats, byCategory, recent, totalBudget] = await Promise.all([
    transactionService.getMonthlyStats(user.id),
    transactionService.getExpensesByCategory(user.id),
    transactionService.getRecentTransactions(user.id, 5),
    budgetService.getTotalBudget(user.id),
  ]);

  const { currentMonth, previousMonth } = stats;

  const expenseDiff = currentMonth.expenses - previousMonth.expenses;
  const expenseTrend =
    previousMonth.expenses > 0
      ? {
          value: `${formatCurrency(Math.abs(expenseDiff))} vs mese scorso`,
          positive: expenseDiff <= 0,
        }
      : null;

  const budgetRemaining = totalBudget > 0 ? totalBudget - currentMonth.expenses : 0;

  const serializedRecent = recent.map((t) => ({
    ...t,
    date: t.date.toISOString(),
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));

  const chartData = byCategory.map((item) => ({
    name: item.category.name,
    value: item.total,
    color: item.category.color,
    icon: item.category.icon,
  }));

  return (
    <>
      <Header title="Dashboard" />
      <div className="space-y-4 p-4 pb-20 md:space-y-6 md:p-6 md:pb-6">
        {/* Stat Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <StatCard
            title="Bilancio Mese"
            value={formatCurrency(currentMonth.balance)}
            icon="💰"
            variant={currentMonth.balance >= 0 ? 'success' : 'danger'}
            subtitle={`Entrate: ${formatCurrency(currentMonth.income)}`}
          />
          <StatCard
            title="Spese del Mese"
            value={formatCurrency(currentMonth.expenses)}
            icon="💸"
            variant="danger"
            trend={expenseTrend}
          />
          <StatCard
            title="Budget Residuo"
            value={totalBudget > 0 ? formatCurrency(budgetRemaining) : 'Non impostato'}
            icon="👛"
            variant={budgetRemaining >= 0 ? 'primary' : 'danger'}
            subtitle={totalBudget > 0 ? `di ${formatCurrency(totalBudget)} totali` : 'Vai in Budget per impostarlo'}
          />
        </div>

        {/* Charts + Recent */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardTitle>Spese per Categoria</CardTitle>
            <div className="mt-4">
              {chartData.length > 0 ? (
                <ExpensePie data={chartData} />
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Nessuna spesa questo mese
                </p>
              )}
            </div>
          </Card>
          <RecentTransactions transactions={serializedRecent} />
        </div>
      </div>
    </>
  );
}
