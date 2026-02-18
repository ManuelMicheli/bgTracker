import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/utils';
import { createTransactionSchema, transactionFiltersSchema } from '@/lib/validators/transaction';
import * as transactionService from '@/lib/services/transaction.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = transactionFiltersSchema.parse(Object.fromEntries(searchParams));
    const result = await transactionService.getTransactions(filters);

    return NextResponse.json({
      data: result.transactions,
      meta: { total: result.total, page: result.page, pageSize: result.pageSize },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createTransactionSchema.parse(body);
    const transaction = await transactionService.createTransaction(validated);

    return NextResponse.json({ data: transaction }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
