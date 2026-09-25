import { create } from 'zustand';
import { Account, Transaction, Category, Budget } from '../database/schema';
import { AccountRepository, TransactionRepository, CategoryRepository, BudgetRepository } from '../database';

interface FinanceState {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  totalBalance: number;
  
  // Actions
  refreshAccounts: () => void;
  refreshTransactions: () => void;
  refreshCategories: () => void;
  refreshBudgets: () => void;
  addAccount: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAccount: (id: string, updates: Partial<Omit<Account, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  deleteAccount: (id: string) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  deleteTransaction: (id: string) => void;
  addBudget: (budget: Omit<Budget, 'id' | 'createdAt'>) => void;
  deleteBudget: (id: string) => void;
}

export const useStore = create<FinanceState>((set, get) => ({
  accounts: [],
  categories: [],
  transactions: [],
  budgets: [],
  totalBalance: 0,

  refreshAccounts: () => {
    const accounts = AccountRepository.getAll();
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    set({ accounts, totalBalance });
  },

  refreshTransactions: () => {
    const transactions = TransactionRepository.getAll();
    set({ transactions });
  },

  refreshCategories: () => {
    const categories = CategoryRepository.getAll();
    set({ categories });
  },

  refreshBudgets: () => {
    const budgets = BudgetRepository.getAll();
    set({ budgets });
  },

  addAccount: (account) => {
    AccountRepository.create(account);
    get().refreshAccounts();
  },

  updateAccount: (id, updates) => {
    AccountRepository.update(id, updates);
    get().refreshAccounts();
  },

  deleteAccount: (id) => {
    AccountRepository.delete(id);
    get().refreshAccounts();
  },

  addTransaction: (transaction) => {
    TransactionRepository.create(transaction);
    get().refreshTransactions();
    // Balance might have changed, refresh accounts too
    get().refreshAccounts();
  },

  deleteTransaction: (id) => {
    TransactionRepository.delete(id);
    get().refreshTransactions();
    get().refreshAccounts();
  },

  addBudget: (budget) => {
    BudgetRepository.create(budget);
    get().refreshBudgets();
  },

  deleteBudget: (id) => {
    BudgetRepository.delete(id);
    get().refreshBudgets();
  },
}));
