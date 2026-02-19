import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/utils';
import { createTransactionSchema, transactionFiltersSchema } from '@/lib/validators/transaction';
import * as transactionService from '@/lib/services/transaction.service';

// GET /api/transactions
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const filters = transactionFiltersSchema.parse(Object.fromEntries(searchParams));
    const result = await transactionService.getTransactions(user.id, filters);

    return NextResponse.json({
      data: result.transactions,
      meta: { total: result.total, page: result.page, pageSize: result.pageSize },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }
    return handleApiError(error);
  }
}

// POST /api/transactions
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const validated = createTransactionSchema.parse(body);
    const transaction = await transactionService.createTransaction(user.id, validated);

    return NextResponse.json({ data: transaction }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }
    return handleApiError(error);
  }
}
