import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import * as transactionService from '@/lib/services/transaction.service';

export async function DELETE() {
  try {
    const user = await requireAuth();
    const result = await transactionService.deleteAllTransactions(user.id);

    return NextResponse.json({ 
      success: true, 
      message: `${result.count} transazioni eliminate` 
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }
    console.error('Error resetting transactions:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
