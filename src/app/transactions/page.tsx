import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { TransactionList } from '@/components/transactions/transaction-list';
import { AddTransactionForm } from '@/components/transactions/add-transaction-form';
import { requireAuth } from '@/lib/auth';
import * as transactionService from '@/lib/services/transaction.service';
import * as categoryService from '@/lib/services/category.service';

export const dynamic = 'force-dynamic';

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; type?: string; categoryId?: string }>;
}) {
  const user = await requireAuth();
  const params = await searchParams;
  const page = parseInt(params.page ?? '1', 10);

  const [result, categories] = await Promise.all([
    transactionService.getTransactions(user.id, {
      page,
      pageSize: 15,
      type: params.type as 'expense' | 'income' | undefined,
      categoryId: params.categoryId,
    }),
    categoryService.getAllCategories(),
  ]);

  const serialized = result.transactions.map((t) => ({
    ...t,
    date: t.date.toISOString(),
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));

  const plainCategories = categories.map((c) => ({
    id: c.id,
    name: c.name,
    icon: c.icon,
    type: c.type,
  }));

  return (
    <>
      <Header title="Transazioni" />
      <div className="space-y-4 p-4 pb-20 md:space-y-6 md:p-6 md:pb-6">
        <AddTransactionForm categories={plainCategories} />
        <Card>
          <TransactionList
            transactions={serialized}
            total={result.total}
            page={result.page}
            pageSize={result.pageSize}
          />
        </Card>
      </div>
    </>
  );
}
