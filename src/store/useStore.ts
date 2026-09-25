import { create } from 'zustand';
import { Account, Transaction } from '../database/schema';
import { AccountRepository, TransactionRepository } from '../database';

interface FinanceState {
  accounts: Account[];
  transactions: Transaction[];
  totalBalance: number;
  
  // Actions
  refreshAccounts: () => void;
  refreshTransactions: () => void;
  addAccount: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAccount: (id: string, updates: Partial<Omit<Account, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  deleteAccount: (id: string) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export const useStore = create<FinanceState>((set, get) => ({
  accounts: [],
  transactions: [],
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
}));
