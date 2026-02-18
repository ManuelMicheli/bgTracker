import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/utils';
import { updateBudgetSchema } from '@/lib/validators/budget';
import * as budgetService from '@/lib/services/budget.service';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = updateBudgetSchema.parse(body);

    if (validated.amount === undefined) {
      return NextResponse.json(
        { error: { message: 'Importo richiesto', code: 'VALIDATION_ERROR' } },
        { status: 400 },
      );
    }

    const budget = await budgetService.updateBudget(id, validated.amount);
    return NextResponse.json({ data: budget });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await budgetService.deleteBudget(id);
    return NextResponse.json({ data: { deleted: true } });
  } catch (error) {
    return handleApiError(error);
  }
}
