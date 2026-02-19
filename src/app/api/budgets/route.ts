import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/utils';
import { createBudgetSchema, budgetFiltersSchema } from '@/lib/validators/budget';
import * as budgetService from '@/lib/services/budget.service';

// GET /api/budgets
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const filters = budgetFiltersSchema.parse(Object.fromEntries(searchParams));
    
    const now = new Date();
    const year = filters.year ?? now.getFullYear();
    const month = filters.month ?? now.getMonth() + 1;

    const budgets = await budgetService.getBudgetsWithSpent(user.id, new Date(year, month - 1));
    const total = await budgetService.getTotalBudget(user.id, new Date(year, month - 1));

    return NextResponse.json({
      data: budgets,
      meta: { total, year, month },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }
    return handleApiError(error);
  }
}

// POST /api/budgets
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const validated = createBudgetSchema.parse(body);
    const budget = await budgetService.createBudget(user.id, validated);

    return NextResponse.json({ data: budget }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }
    return handleApiError(error);
  }
}
