import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/utils';
import { createTransactionSchema, transactionFiltersSchema } from '@/lib/validators/transaction';
import * as transactionService from '@/lib/services/transaction.service';

// GET /api/transactions
export async function GET(request: NextRequest) {
  try {
    const user = await requireApiAuth();

    const { searchParams } = new URL(request.url);
    const filters = transactionFiltersSchema.parse(Object.fromEntries(searchParams));
    const result = await transactionService.getTransactions(user.id, filters);

    return NextResponse.json({
      data: result.transactions,
      meta: { total: result.total, page: result.page, pageSize: result.pageSize },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/transactions
export async function POST(request: NextRequest) {
  try {
    const user = await requireApiAuth();

    const body = await request.json();
    const validated = createTransactionSchema.parse(body);
    const transaction = await transactionService.createTransaction(user.id, validated);

    return NextResponse.json({ data: transaction }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
