import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/utils';
import { createBudgetSchema } from '@/lib/validators/budget';
import * as budgetService from '@/lib/services/budget.service';

export async function GET() {
  try {
    const budgets = await budgetService.getBudgetsWithSpent();
    return NextResponse.json({ data: budgets });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createBudgetSchema.parse(body);
    const budget = await budgetService.createBudget(validated);

    return NextResponse.json({ data: budget }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
