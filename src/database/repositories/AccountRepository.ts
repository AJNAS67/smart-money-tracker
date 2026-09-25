import { db } from '../database';
import { Account, AccountType } from '../schema';
import * as Crypto from 'expo-crypto';

export class AccountRepository {
  static getAll(): Account[] {
    return db.getAllSync<Account>('SELECT * FROM accounts ORDER BY createdAt DESC');
  }

  static getById(id: string): Account | null {
    return db.getFirstSync<Account>('SELECT * FROM accounts WHERE id = ?', id);
  }

  static create(account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Account {
    const id = Crypto.randomUUID();
    const now = Date.now();
    
    db.runSync(
      `INSERT INTO accounts (id, name, type, balance, icon, color, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, account.name, account.type, account.balance, account.icon || null, account.color || null, now, now]
    );

    return { ...account, id, createdAt: now, updatedAt: now };
  }

  static update(id: string, updates: Partial<Omit<Account, 'id' | 'createdAt' | 'updatedAt'>>): void {
    const now = Date.now();
    const current = this.getById(id);
    if (!current) throw new Error('Account not found');

    const updated = { ...current, ...updates, updatedAt: now };

    db.runSync(
      `UPDATE accounts SET name = ?, type = ?, balance = ?, icon = ?, color = ?, updatedAt = ? WHERE id = ?`,
      [updated.name, updated.type, updated.balance, updated.icon || null, updated.color || null, now, id]
    );
  }

  static delete(id: string): void {
    db.runSync('DELETE FROM accounts WHERE id = ?', id);
  }

  static updateBalance(id: string, amountChange: number): void {
    const now = Date.now();
    db.runSync(
      'UPDATE accounts SET balance = balance + ?, updatedAt = ? WHERE id = ?',
      [amountChange, now, id]
    );
  }
}
