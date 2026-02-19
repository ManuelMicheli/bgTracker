import { prisma } from '@/lib/prisma';
import type { CreateTransactionInput, TransactionFilters } from '@/lib/validators/transaction';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

const DEFAULT_USER_ID = 'default-user';
const DEFAULT_PAGE_SIZE = 20;

export async function getTransactions(filters: TransactionFilters = {}) {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = { userId: DEFAULT_USER_ID };

  if (filters.type) where.type = filters.type;
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.from || filters.to) {
    where.date = {
      ...(filters.from ? { gte: new Date(filters.from) } : {}),
      ...(filters.to ? { lte: new Date(filters.to) } : {}),
    };
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, icon: true, color: true } },
      },
      orderBy: { date: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.transaction.count({ where }),
  ]);

  return { transactions, total, page, pageSize };
}

export async function getTransactionById(id: string) {
  return prisma.transaction.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true, icon: true, color: true } },
    },
  });
}

export async function createTransaction(data: CreateTransactionInput) {
  return prisma.transaction.create({
    data: {
      amount: data.amount,
      description: data.description,
      date: data.date ? new Date(data.date) : new Date(),
      type: data.type ?? 'expense',
      source: data.source ?? 'manual',
      notes: data.notes,
      userId: DEFAULT_USER_ID,
      categoryId: data.categoryId,
    },
    include: {
      category: { select: { id: true, name: true, icon: true, color: true } },
    },
  });
}

export async function updateTransaction(id: string, data: Partial<CreateTransactionInput>) {
  return prisma.transaction.update({
    where: { id },
    data: {
      ...(data.amount !== undefined && { amount: data.amount }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.date !== undefined && { date: new Date(data.date) }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
    },
    include: {
      category: { select: { id: true, name: true, icon: true, color: true } },
    },
  });
}

export async function deleteTransaction(id: string) {
  return prisma.transaction.delete({ where: { id } });
}

export async function deleteAllTransactions() {
  return prisma.transaction.deleteMany();
}

export async function getMonthlyStats(date: Date = new Date()) {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const prevMonthStart = startOfMonth(subMonths(date, 1));
  const prevMonthEnd = endOfMonth(subMonths(date, 1));

  const [currentExpenses, currentIncome, prevExpenses, prevIncome] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        userId: DEFAULT_USER_ID,
        type: 'expense',
        date: { gte: monthStart, lte: monthEnd },
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
        type: 'expense',
        date: { gte: prevMonthStart, lte: prevMonthEnd },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        userId: DEFAULT_USER_ID,
        type: 'income',
        date: { gte: prevMonthStart, lte: prevMonthEnd },
      },
      _sum: { amount: true },
    }),
  ]);

  return {
    currentMonth: {
      expenses: currentExpenses._sum.amount ?? 0,
      income: currentIncome._sum.amount ?? 0,
      balance: (currentIncome._sum.amount ?? 0) - (currentExpenses._sum.amount ?? 0),
    },
    previousMonth: {
      expenses: prevExpenses._sum.amount ?? 0,
      income: prevIncome._sum.amount ?? 0,
      balance: (prevIncome._sum.amount ?? 0) - (prevExpenses._sum.amount ?? 0),
    },
  };
}

export async function getExpensesByCategory(date: Date = new Date()) {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);

  const expenses = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: {
      userId: DEFAULT_USER_ID,
      type: 'expense',
      date: { gte: monthStart, lte: monthEnd },
    },
    _sum: { amount: true },
    orderBy: { _sum: { amount: 'desc' } },
  });

  const categoryIds = expenses.map((e) => e.categoryId);
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
  });

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  return expenses.map((e) => ({
    categoryId: e.categoryId,
    category: categoryMap.get(e.categoryId)!,
    total: e._sum.amount ?? 0,
  }));
}

export async function getRecentTransactions(limit = 5) {
  return prisma.transaction.findMany({
    where: { userId: DEFAULT_USER_ID },
    include: {
      category: { select: { id: true, name: true, icon: true, color: true } },
    },
    orderBy: { date: 'desc' },
    take: limit,
  });
}
