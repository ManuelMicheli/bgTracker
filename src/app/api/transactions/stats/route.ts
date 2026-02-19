import { NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/auth';
import * as transactionService from '@/lib/services/transaction.service';

export async function GET() {
  try {
    const user = await requireApiAuth();

    const stats = await transactionService.getMonthlyStats(user.id);
    const byCategory = await transactionService.getExpensesByCategory(user.id);

    return NextResponse.json({
      data: {
        ...stats,
        byCategory,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
