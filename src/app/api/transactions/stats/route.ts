import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/utils';
import * as transactionService from '@/lib/services/transaction.service';

export async function GET() {
  try {
    const [monthly, byCategory, recent] = await Promise.all([
      transactionService.getMonthlyStats(),
      transactionService.getExpensesByCategory(),
      transactionService.getRecentTransactions(),
    ]);

    return NextResponse.json({
      data: {
        monthly,
        byCategory,
        recent,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
