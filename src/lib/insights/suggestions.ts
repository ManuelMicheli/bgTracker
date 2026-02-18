import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import type { SpendingAnalysis } from './analyzer';

const DEFAULT_USER_ID = 'default-user';

export type SuggestionSeverity = 'info' | 'warning' | 'danger' | 'success';

export interface Suggestion {
  id: string;
  icon: string;
  title: string;
  description: string;
  severity: SuggestionSeverity;
}

export async function generateSuggestions(analysis: SpendingAnalysis): Promise<Suggestion[]> {
  const suggestions: Suggestion[] = [];
  const { overview, byCategory, topExpenseCategory, fastestGrowing } = analysis;

  // 1. Budget overruns
  const budgetSuggestions = await checkBudgetOverruns();
  suggestions.push(...budgetSuggestions);

  // 2. Expense trend vs previous month
  if (overview.expenseChangePercent > 15 && overview.previous.totalExpenses > 0) {
    suggestions.push({
      id: 'expense-increase',
      icon: '📈',
      title: 'Spese in aumento',
      description: `Stai spendendo il ${Math.round(overview.expenseChangePercent)}% in più rispetto a ${overview.previous.month}. Le uscite totali sono passate da ${formatCurrency(overview.previous.totalExpenses)} a ${formatCurrency(overview.current.totalExpenses)}.`,
      severity: 'warning',
    });
  } else if (overview.expenseChangePercent < -10 && overview.previous.totalExpenses > 0) {
    suggestions.push({
      id: 'expense-decrease',
      icon: '📉',
      title: 'Ottimo lavoro!',
      description: `Hai ridotto le spese del ${Math.round(Math.abs(overview.expenseChangePercent))}% rispetto a ${overview.previous.month}. Stai risparmiando ${formatCurrency(Math.abs(overview.expenseChange))}.`,
      severity: 'success',
    });
  }

  // 3. Top expense category awareness
  if (topExpenseCategory && overview.current.totalExpenses > 0) {
    const percent = Math.round(
      (topExpenseCategory.currentMonth / overview.current.totalExpenses) * 100,
    );
    if (percent > 40) {
      suggestions.push({
        id: 'top-category',
        icon: topExpenseCategory.categoryIcon,
        title: `${topExpenseCategory.categoryName} domina le spese`,
        description: `La categoria "${topExpenseCategory.categoryName}" rappresenta il ${percent}% delle tue uscite (${formatCurrency(topExpenseCategory.currentMonth)}). Valuta se puoi ridurre questa voce.`,
        severity: 'info',
      });
    }
  }

  // 4. Fastest growing category
  if (fastestGrowing && fastestGrowing.changePercent > 25) {
    suggestions.push({
      id: 'fastest-growing',
      icon: '🚀',
      title: `${fastestGrowing.categoryName} in forte crescita`,
      description: `Le spese per "${fastestGrowing.categoryName}" sono aumentate del ${Math.round(fastestGrowing.changePercent)}% (da ${formatCurrency(fastestGrowing.previousMonth)} a ${formatCurrency(fastestGrowing.currentMonth)}).`,
      severity: 'warning',
    });
  }

  // 5. Subscription check
  if (analysis.subscriptionTotal > 0) {
    const yearlyProjection = analysis.subscriptionTotal * 12;
    suggestions.push({
      id: 'subscriptions',
      icon: '📱',
      title: 'Abbonamenti attivi',
      description: `Spendi ${formatCurrency(analysis.subscriptionTotal)}/mese in abbonamenti (${formatCurrency(yearlyProjection)}/anno). Verifica se li utilizzi tutti attivamente.`,
      severity: analysis.subscriptionTotal > 50 ? 'warning' : 'info',
    });
  }

  // 6. Projected expense
  if (analysis.daysPassed >= 7 && analysis.daysPassed < analysis.daysInMonth) {
    const projectedOverBudget = analysis.projectedMonthlyExpense > overview.current.totalIncome;
    suggestions.push({
      id: 'projection',
      icon: '🔮',
      title: 'Proiezione fine mese',
      description: `Al ritmo attuale (${formatCurrency(analysis.averageDailyExpense)}/giorno), a fine mese avrai speso circa ${formatCurrency(analysis.projectedMonthlyExpense)}.`,
      severity: projectedOverBudget ? 'danger' : 'info',
    });
  }

  // 7. Negative balance
  if (overview.current.balance < 0) {
    suggestions.push({
      id: 'negative-balance',
      icon: '🔴',
      title: 'Bilancio negativo',
      description: `Le uscite superano le entrate di ${formatCurrency(Math.abs(overview.current.balance))} questo mese. Cerca di contenere le spese nei prossimi giorni.`,
      severity: 'danger',
    });
  }

  // 8. Saving opportunity - categories that decreased
  const decreased = byCategory.filter(
    (c) => c.change < 0 && c.previousMonth > 0 && Math.abs(c.changePercent) > 20,
  );
  if (decreased.length > 0) {
    const saved = decreased.reduce((sum, c) => sum + Math.abs(c.change), 0);
    suggestions.push({
      id: 'saving-progress',
      icon: '💪',
      title: 'Risparmi in corso',
      description: `Stai risparmiando ${formatCurrency(saved)} in ${decreased.map((c) => c.categoryName).join(', ')} rispetto al mese scorso. Continua così!`,
      severity: 'success',
    });
  }

  // 9. No data fallback
  if (overview.current.totalExpenses === 0 && overview.current.totalIncome === 0) {
    suggestions.push({
      id: 'no-data',
      icon: '📝',
      title: 'Inizia a tracciare',
      description:
        'Non ci sono ancora transazioni questo mese. Usa il bot Telegram o la pagina Transazioni per registrare le tue spese!',
      severity: 'info',
    });
  }

  return suggestions;
}

async function checkBudgetOverruns(): Promise<Suggestion[]> {
  const suggestions: Suggestion[] = [];
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const budgets = await prisma.budget.findMany({
    where: { userId: DEFAULT_USER_ID, year, month },
    include: { category: true },
  });

  if (budgets.length === 0) return suggestions;

  const expenses = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: {
      userId: DEFAULT_USER_ID,
      type: 'expense',
      date: { gte: monthStart, lte: monthEnd },
    },
    _sum: { amount: true },
  });

  const expenseMap = new Map(expenses.map((e) => [e.categoryId, e._sum.amount ?? 0]));

  for (const budget of budgets) {
    const spent = expenseMap.get(budget.categoryId) ?? 0;
    const percent = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

    if (percent >= 100) {
      suggestions.push({
        id: `budget-over-${budget.categoryId}`,
        icon: '🚨',
        title: `Budget "${budget.category.name}" sforato`,
        description: `Hai speso ${formatCurrency(spent)} su un budget di ${formatCurrency(budget.amount)} per "${budget.category.name}" (${Math.round(percent)}%). Hai superato il limite di ${formatCurrency(spent - budget.amount)}.`,
        severity: 'danger',
      });
    } else if (percent >= 80) {
      suggestions.push({
        id: `budget-warn-${budget.categoryId}`,
        icon: '⚠️',
        title: `Budget "${budget.category.name}" quasi esaurito`,
        description: `Hai usato l'${Math.round(percent)}% del budget per "${budget.category.name}" (${formatCurrency(spent)} su ${formatCurrency(budget.amount)}). Rimangono ${formatCurrency(budget.amount - spent)}.`,
        severity: 'warning',
      });
    }
  }

  return suggestions;
}
