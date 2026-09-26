import { create } from 'zustand';
import { Account, Transaction, Category, Budget, Vault } from '../database/schema';
import { AccountRepository, TransactionRepository, CategoryRepository, BudgetRepository, VaultRepository } from '../database';

interface FinanceState {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  vaults: Vault[];
  totalBalance: number;
  
  // Actions
  refreshAccounts: () => void;
  refreshTransactions: () => void;
  refreshCategories: () => void;
  refreshBudgets: () => void;
  refreshVaults: () => void;
  addAccount: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAccount: (id: string, updates: Partial<Omit<Account, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  deleteAccount: (id: string) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  deleteTransaction: (id: string) => void;
  addBudget: (budget: Omit<Budget, 'id' | 'createdAt'>) => void;
  deleteBudget: (id: string) => void;
  addVault: (vault: Omit<Vault, 'id' | 'createdAt' | 'updatedAt' | 'currentAmount'>) => void;
  addFundsToVault: (vaultId: string, accountId: string, amount: number) => void;
}

export const useStore = create<FinanceState>((set, get) => ({
  accounts: [],
  categories: [],
  transactions: [],
  budgets: [],
  vaults: [],
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

  refreshVaults: () => {
    const vaults = VaultRepository.getAll();
    set({ vaults });
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

  addVault: (vault) => {
    VaultRepository.create(vault);
    get().refreshVaults();
  },

  addFundsToVault: (vaultId, accountId, amount) => {
    // 1. Deduct from account
    AccountRepository.updateBalance(accountId, -amount);
    
    // 2. Add to vault
    VaultRepository.addFunds(vaultId, amount);
    
    // 3. Create a transaction representing the transfer to vault
    TransactionRepository.create({
      accountId,
      amount,
      type: 'TRANSFER',
      note: 'Transfer to Vault',
      date: Date.now()
    });

    get().refreshAccounts();
    get().refreshTransactions();
    get().refreshVaults();
  },
}));
