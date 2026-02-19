import { NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/auth';
import * as transactionService from '@/lib/services/transaction.service';

export async function DELETE() {
  try {
    const user = await requireApiAuth();

    const result = await transactionService.deleteAllTransactions(user.id);

    return NextResponse.json({
      success: true,
      message: `${result.count} transazioni eliminate`
    });
  } catch (error) {
    console.error('Error resetting transactions:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
