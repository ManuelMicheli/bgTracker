export type BudgetPeriod = 'monthly' | 'annual';

export interface BudgetWithCategory {
  id: string;
  amount: number;
  period: BudgetPeriod;
  month: number | null;
  year: number;
  categoryId: string;
  category: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
  spent?: number;
  remaining?: number;
  percentage?: number;
}
