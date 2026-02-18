export type TransactionType = 'expense' | 'income';
export type TransactionSource = 'manual' | 'telegram' | 'csv';

export interface TransactionWithCategory {
  id: string;
  amount: number;
  description: string;
  date: string;
  type: TransactionType;
  source: TransactionSource;
  notes: string | null;
  categoryId: string;
  category: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
  createdAt: string;
}
