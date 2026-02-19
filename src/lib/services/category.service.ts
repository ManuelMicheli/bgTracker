import { prisma } from '@/lib/prisma';
import type { CreateCategoryInput, UpdateCategoryInput } from '@/lib/validators/category';

export async function getAllCategories() {
  return prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { transactions: true } },
    },
  });
}

export async function getCategoryById(id: string) {
  return prisma.category.findUnique({ where: { id } });
}

export async function getCategoryByName(name: string) {
  return prisma.category.findUnique({ where: { name } });
}

export async function getExpenseCategories() {
  return prisma.category.findMany({
    where: { type: 'expense' },
    orderBy: { name: 'asc' },
  });
}

export async function getIncomeCategories() {
  return prisma.category.findMany({
    where: { type: 'income' },
    orderBy: { name: 'asc' },
  });
}

export async function createCategory(data: CreateCategoryInput) {
  return prisma.category.create({
    data: {
      name: data.name,
      icon: data.icon ?? '📦',
      color: data.color ?? '#6b7280',
      type: data.type ?? 'expense',
    },
  });
}

export async function updateCategory(id: string, data: UpdateCategoryInput) {
  return prisma.category.update({
    where: { id },
    data,
  });
}

export async function deleteCategory(id: string) {
  return prisma.category.delete({
    where: { id },
  });
}

export async function getCategoryTransactionCount(id: string) {
  return prisma.transaction.count({
    where: { categoryId: id },
  });
}
