import { Header } from '@/components/layout/header';
import { Card, CardTitle } from '@/components/ui/card';
import { BudgetList } from '@/components/budget/budget-list';
import { AddBudgetForm } from '@/components/budget/add-budget-form';
import { formatCurrency } from '@/lib/utils';
import * as budgetService from '@/lib/services/budget.service';
import * as categoryService from '@/lib/services/category.service';

export const dynamic = 'force-dynamic';

export default async function BudgetPage() {
  const [budgets, categories] = await Promise.all([
    budgetService.getBudgetsWithSpent(),
    categoryService.getExpenseCategories(),
  ]);

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const totalRemaining = totalBudget - totalSpent;

  const plainCategories = categories.map((c) => ({
    id: c.id,
    name: c.name,
    icon: c.icon,
  }));

  const existingCategoryIds = budgets.map((b) => b.categoryId);

  const now = new Date();
  const monthName = now.toLocaleString('it-IT', { month: 'long', year: 'numeric' });

  return (
    <>
      <Header title="Budget" />
      <div className="space-y-6 p-6">
        {/* Summary */}
        {budgets.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="text-center">
              <p className="text-sm text-muted-foreground">Budget Totale</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(totalBudget)}</p>
            </Card>
            <Card className="text-center">
              <p className="text-sm text-muted-foreground">Speso</p>
              <p className="text-2xl font-bold text-danger">{formatCurrency(totalSpent)}</p>
            </Card>
            <Card className="text-center">
              <p className="text-sm text-muted-foreground">Rimanente</p>
              <p className={`text-2xl font-bold ${totalRemaining >= 0 ? 'text-success' : 'text-danger'}`}>
                {formatCurrency(totalRemaining)}
              </p>
            </Card>
          </div>
        )}

        {/* Budget cards */}
        <Card>
          <CardTitle>Budget {monthName}</CardTitle>
          <div className="mt-4">
            <BudgetList budgets={budgets} />
          </div>
        </Card>

        {/* Add budget */}
        <Card>
          <CardTitle>Aggiungi Budget</CardTitle>
          <div className="mt-4">
            <AddBudgetForm
              categories={plainCategories}
              existingCategoryIds={existingCategoryIds}
            />
          </div>
        </Card>
      </div>
    </>
  );
}
