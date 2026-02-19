import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth } from 'date-fns';
import type { CreateBudgetInput } from '@/lib/validators/budget';

export async function getBudgets(userId: string, year: number, month?: number) {
  return prisma.budget.findMany({
    where: {
      userId,
      year,
      ...(month !== undefined ? { month } : {}),
    },
    include: {
      category: { select: { id: true, name: true, icon: true, color: true } },
    },
    orderBy: { category: { name: 'asc' } },
  });
}

export async function getBudgetsWithSpent(userId: string, date: Date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);

  const budgets = await prisma.budget.findMany({
    where: {
      userId,
      year,
      month,
    },
    include: {
      category: { select: { id: true, name: true, icon: true, color: true } },
    },
  });

  const expenses = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: {
      userId,
      type: 'expense',
      date: { gte: monthStart, lte: monthEnd },
    },
    _sum: { amount: true },
  });

  const expenseMap = new Map(expenses.map((e) => [e.categoryId, e._sum.amount ?? 0]));

  return budgets.map((b) => {
    const spent = expenseMap.get(b.categoryId) ?? 0;
    return {
      ...b,
      spent,
      remaining: b.amount - spent,
      percentage: b.amount > 0 ? Math.min((spent / b.amount) * 100, 100) : 0,
    };
  });
}

export async function getTotalBudget(userId: string, date: Date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  const result = await prisma.budget.aggregate({
    where: {
      userId,
      year,
      month,
    },
    _sum: { amount: true },
  });

  return result._sum.amount ?? 0;
}

export async function createBudget(userId: string, data: CreateBudgetInput) {
  return prisma.budget.create({
    data: {
      amount: data.amount,
      period: data.period,
      month: data.month,
      year: data.year,
      userId,
      categoryId: data.categoryId,
    },
    include: {
      category: { select: { id: true, name: true, icon: true, color: true } },
    },
  });
}

export async function updateBudget(id: string, userId: string, amount: number) {
  return prisma.budget.update({
    where: { id, userId },
    data: { amount },
    include: {
      category: { select: { id: true, name: true, icon: true, color: true } },
    },
  });
}

export async function deleteBudget(id: string, userId: string) {
  return prisma.budget.delete({ where: { id, userId } });
}
