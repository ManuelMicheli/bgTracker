import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/utils';
import { updateTransactionSchema } from '@/lib/validators/transaction';
import * as transactionService from '@/lib/services/transaction.service';

// GET /api/transactions/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireApiAuth();

    const { id } = await params;
    const transaction = await transactionService.getTransactionById(id, user.id);

    if (!transaction) {
      return NextResponse.json({ error: 'Transazione non trovata' }, { status: 404 });
    }

    return NextResponse.json({ data: transaction });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/transactions/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireApiAuth();

    const { id } = await params;
    const body = await request.json();
    const validated = updateTransactionSchema.parse(body);
    const transaction = await transactionService.updateTransaction(id, user.id, validated);

    return NextResponse.json({ data: transaction });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/transactions/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireApiAuth();

    const { id } = await params;
    await transactionService.deleteTransaction(id, user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
