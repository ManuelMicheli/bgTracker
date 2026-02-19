import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/utils';
import * as transactionService from '@/lib/services/transaction.service';

export async function DELETE() {
  try {
    const result = await transactionService.deleteAllTransactions();
    return NextResponse.json({ data: { deleted: result.count } });
  } catch (error) {
    return handleApiError(error);
  }
}
