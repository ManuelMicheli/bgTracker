import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { it } from 'date-fns/locale';

const DEFAULT_USER_ID = 'default-user';

export interface CategorySpending {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  currentMonth: number;
  previousMonth: number;
  change: number;
  changePercent: number;
}

export interface MonthlyOverview {
  month: string;
  totalExpenses: number;
  totalIncome: number;
  balance: number;
}

export interface SpendingAnalysis {
  currentMonthLabel: string;
  previousMonthLabel: string;
  overview: {
    current: MonthlyOverview;
    previous: MonthlyOverview;
    expenseChange: number;
    expenseChangePercent: number;
  };
  byCategory: CategorySpending[];
  topExpenseCategory: CategorySpending | null;
  fastestGrowing: CategorySpending | null;
  subscriptionTotal: number;
  averageDailyExpense: number;
  daysInMonth: number;
  daysPassed: number;
  projectedMonthlyExpense: number;
}

export async function analyzeSpending(date: Date = new Date()): Promise<SpendingAnalysis> {
  const now = date;
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const prevStart = startOfMonth(subMonths(now, 1));
  const prevEnd = endOfMonth(subMonths(now, 1));

  const daysPassed = now.getDate();
  const daysInMonth = monthEnd.getDate();

  // Aggregate current and previous month expenses by category
  const [currentByCategory, previousByCategory, currentIncome, previousIncome, categories] =
    await Promise.all([
      prisma.transaction.groupBy({
        by: ['categoryId'],
        where: {
          userId: DEFAULT_USER_ID,
          type: 'expense',
          date: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
      }),
      prisma.transaction.groupBy({
        by: ['categoryId'],
        where: {
          userId: DEFAULT_USER_ID,
          type: 'expense',
          date: { gte: prevStart, lte: prevEnd },
        },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: {
          userId: DEFAULT_USER_ID,
          type: 'income',
          date: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: {
          userId: DEFAULT_USER_ID,
          type: 'income',
          date: { gte: prevStart, lte: prevEnd },
        },
        _sum: { amount: true },
      }),
      prisma.category.findMany(),
    ]);

  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const currentMap = new Map(currentByCategory.map((e) => [e.categoryId, e._sum.amount ?? 0]));
  const previousMap = new Map(previousByCategory.map((e) => [e.categoryId, e._sum.amount ?? 0]));

  // Build per-category comparison
  const allCategoryIds = new Set([...currentMap.keys(), ...previousMap.keys()]);
  const byCategory: CategorySpending[] = [];

  for (const catId of allCategoryIds) {
    const cat = categoryMap.get(catId);
    if (!cat) continue;

    const current = currentMap.get(catId) ?? 0;
    const previous = previousMap.get(catId) ?? 0;
    const change = current - previous;
    const changePercent = previous > 0 ? (change / previous) * 100 : current > 0 ? 100 : 0;

    byCategory.push({
      categoryId: catId,
      categoryName: cat.name,
      categoryIcon: cat.icon,
      categoryColor: cat.color,
      currentMonth: current,
      previousMonth: previous,
      change,
      changePercent,
    });
  }

  byCategory.sort((a, b) => b.currentMonth - a.currentMonth);

  const totalCurrentExpenses = byCategory.reduce((s, c) => s + c.currentMonth, 0);
  const totalPreviousExpenses = byCategory.reduce((s, c) => s + c.previousMonth, 0);
  const totalCurrentIncome = currentIncome._sum.amount ?? 0;
  const totalPreviousIncome = previousIncome._sum.amount ?? 0;

  const expenseChange = totalCurrentExpenses - totalPreviousExpenses;
  const expenseChangePercent =
    totalPreviousExpenses > 0 ? (expenseChange / totalPreviousExpenses) * 100 : 0;

  // Find subscription category total
  const subscriptionCat = categories.find((c) => c.name === 'Abbonamenti');
  const subscriptionTotal = subscriptionCat ? (currentMap.get(subscriptionCat.id) ?? 0) : 0;

  // Top expense category
  const topExpenseCategory = byCategory.length > 0 ? byCategory[0] : null;

  // Fastest growing (highest positive change %)
  const growing = byCategory.filter((c) => c.change > 0 && c.previousMonth > 0);
  growing.sort((a, b) => b.changePercent - a.changePercent);
  const fastestGrowing = growing.length > 0 ? growing[0] : null;

  const averageDailyExpense = daysPassed > 0 ? totalCurrentExpenses / daysPassed : 0;
  const projectedMonthlyExpense = averageDailyExpense * daysInMonth;

  return {
    currentMonthLabel: format(now, 'MMMM yyyy', { locale: it }),
    previousMonthLabel: format(subMonths(now, 1), 'MMMM yyyy', { locale: it }),
    overview: {
      current: {
        month: format(now, 'MMMM yyyy', { locale: it }),
        totalExpenses: totalCurrentExpenses,
        totalIncome: totalCurrentIncome,
        balance: totalCurrentIncome - totalCurrentExpenses,
      },
      previous: {
        month: format(subMonths(now, 1), 'MMMM yyyy', { locale: it }),
        totalExpenses: totalPreviousExpenses,
        totalIncome: totalPreviousIncome,
        balance: totalPreviousIncome - totalPreviousExpenses,
      },
      expenseChange,
      expenseChangePercent,
    },
    byCategory,
    topExpenseCategory,
    fastestGrowing,
    subscriptionTotal,
    averageDailyExpense,
    daysInMonth,
    daysPassed,
    projectedMonthlyExpense,
  };
}
