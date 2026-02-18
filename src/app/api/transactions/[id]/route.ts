import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/utils';
import { updateTransactionSchema } from '@/lib/validators/transaction';
import * as transactionService from '@/lib/services/transaction.service';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const transaction = await transactionService.getTransactionById(id);

    if (!transaction) {
      return NextResponse.json(
        { error: { message: 'Transazione non trovata', code: 'NOT_FOUND' } },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: transaction });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = updateTransactionSchema.parse(body);
    const transaction = await transactionService.updateTransaction(id, validated);

    return NextResponse.json({ data: transaction });
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
    await transactionService.deleteTransaction(id);

    return NextResponse.json({ data: { deleted: true } });
  } catch (error) {
    return handleApiError(error);
  }
}
