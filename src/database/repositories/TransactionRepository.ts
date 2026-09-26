import { db } from '../connection';
import { Transaction } from '../schema';
import * as Crypto from 'expo-crypto';
import { AccountRepository } from './AccountRepository';

export class TransactionRepository {
  static getAll(): Transaction[] {
    return db.getAllSync<Transaction>('SELECT * FROM transactions ORDER BY date DESC, createdAt DESC');
  }

  static getByAccountId(accountId: string): Transaction[] {
    return db.getAllSync<Transaction>(
      'SELECT * FROM transactions WHERE accountId = ? ORDER BY date DESC', 
      [accountId]
    );
  }

  static create(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Transaction {
    const id = Crypto.randomUUID();
    const now = Date.now();
    
    // Begin transaction for safety
    db.execSync('BEGIN TRANSACTION');
    
    try {
      db.runSync(
        `INSERT INTO transactions (id, accountId, categoryId, amount, type, date, note, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, transaction.accountId, transaction.categoryId || null, transaction.amount, transaction.type, transaction.date, transaction.note || null, now, now]
      );

      // Adjust account balance based on transaction type
      let amountChange = 0;
      if (transaction.type === 'INCOME') amountChange = transaction.amount;
      if (transaction.type === 'EXPENSE') amountChange = -transaction.amount;
      
      if (amountChange !== 0) {
        AccountRepository.updateBalance(transaction.accountId, amountChange);
      }

      db.execSync('COMMIT');
      return { ...transaction, id, createdAt: now, updatedAt: now };
    } catch (error) {
      db.execSync('ROLLBACK');
      throw error;
    }
  }

  static delete(id: string): void {
    const transaction = db.getFirstSync<Transaction>('SELECT * FROM transactions WHERE id = ?', id);
    if (!transaction) return;

    db.execSync('BEGIN TRANSACTION');
    try {
      db.runSync('DELETE FROM transactions WHERE id = ?', id);

      // Revert account balance
      let amountChange = 0;
      if (transaction.type === 'INCOME') amountChange = -transaction.amount;
      if (transaction.type === 'EXPENSE') amountChange = transaction.amount;
      
      if (amountChange !== 0) {
        AccountRepository.updateBalance(transaction.accountId, amountChange);
      }

      db.execSync('COMMIT');
    } catch (error) {
      db.execSync('ROLLBACK');
      throw error;
    }
  }
}
