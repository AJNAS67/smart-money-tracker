import { db } from '../connection';
import { Budget } from '../schema';
import * as Crypto from 'expo-crypto';

export class BudgetRepository {
  static getAll(): Budget[] {
    return db.getAllSync<Budget>('SELECT * FROM budgets ORDER BY createdAt DESC');
  }

  static getById(id: string): Budget | null {
    return db.getFirstSync<Budget>('SELECT * FROM budgets WHERE id = ?', id);
  }

  static getByCategoryId(categoryId: string): Budget | null {
    return db.getFirstSync<Budget>('SELECT * FROM budgets WHERE categoryId = ?', categoryId);
  }

  static create(budget: Omit<Budget, 'id' | 'createdAt'>): Budget {
    const id = Crypto.randomUUID();
    const now = Date.now();
    
    db.runSync(
      `INSERT INTO budgets (id, categoryId, limitAmount, period, createdAt) 
       VALUES (?, ?, ?, ?, ?)`,
      [id, budget.categoryId, budget.limitAmount, budget.period, now]
    );

    return { ...budget, id, createdAt: now };
  }

  static update(id: string, updates: Partial<Omit<Budget, 'id' | 'createdAt'>>): void {
    const current = this.getById(id);
    if (!current) throw new Error('Budget not found');

    const updated = { ...current, ...updates };

    db.runSync(
      `UPDATE budgets SET categoryId = ?, limitAmount = ?, period = ? WHERE id = ?`,
      [updated.categoryId, updated.limitAmount, updated.period, id]
    );
  }

  static delete(id: string): void {
    db.runSync('DELETE FROM budgets WHERE id = ?', id);
  }
}
