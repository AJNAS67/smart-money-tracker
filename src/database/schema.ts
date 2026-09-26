export type AccountType = string;
export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  icon?: string;
  color?: string;
  creditLimit?: number;
  billPaymentDate?: number;
  createdAt: number;
  updatedAt: number;
}

export interface Category {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  icon?: string;
  color?: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  categoryId?: string | null;
  amount: number;
  type: TransactionType;
  date: number;
  note?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Budget {
  id: string;
  categoryId: string;
  limitAmount: number;
  period: 'MONTHLY' | 'WEEKLY';
  createdAt: number;
}

export interface Vault {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  color?: string;
  createdAt: number;
  updatedAt: number;
}
