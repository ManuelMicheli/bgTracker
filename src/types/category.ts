export type CategoryType = 'expense' | 'income';

export interface CategoryWithStats {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
  isDefault: boolean;
  _count?: {
    transactions: number;
  };
}
