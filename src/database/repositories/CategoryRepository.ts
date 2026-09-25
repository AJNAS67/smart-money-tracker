import { db } from '../database';
import { Category } from '../schema';
import * as Crypto from 'expo-crypto';

const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  // Expenses
  { name: 'Food & Dining', type: 'EXPENSE', icon: 'restaurant', color: '#EF4444' },
  { name: 'Transportation', type: 'EXPENSE', icon: 'car', color: '#3B82F6' },
  { name: 'Shopping', type: 'EXPENSE', icon: 'cart', color: '#10B981' },
  { name: 'Entertainment', type: 'EXPENSE', icon: 'film', color: '#8B5CF6' },
  { name: 'Housing', type: 'EXPENSE', icon: 'home', color: '#F59E0B' },
  { name: 'Utilities', type: 'EXPENSE', icon: 'flash', color: '#06B6D4' },
  { name: 'Health & Fitness', type: 'EXPENSE', icon: 'fitness', color: '#EC4899' },
  
  // Income
  { name: 'Salary', type: 'INCOME', icon: 'cash', color: '#10B981' },
  { name: 'Business', type: 'INCOME', icon: 'briefcase', color: '#3B82F6' },
  { name: 'Investments', type: 'INCOME', icon: 'trending-up', color: '#8B5CF6' },
  { name: 'Gifts', type: 'INCOME', icon: 'gift', color: '#F59E0B' }
];

export class CategoryRepository {
  static getAll(): Category[] {
    return db.getAllSync<Category>('SELECT * FROM categories ORDER BY name ASC');
  }

  static getById(id: string): Category | null {
    return db.getFirstSync<Category>('SELECT * FROM categories WHERE id = ?', id);
  }

  static create(category: Omit<Category, 'id'>): Category {
    const id = Crypto.randomUUID();
    db.runSync(
      `INSERT INTO categories (id, name, type, icon, color) VALUES (?, ?, ?, ?, ?)`,
      [id, category.name, category.type, category.icon || null, category.color || null]
    );
    return { ...category, id };
  }

  static seedDefaults(): void {
    const existingCount = db.getFirstSync<{count: number}>('SELECT COUNT(*) as count FROM categories');
    if (existingCount && existingCount.count > 0) {
      return; // Already seeded
    }

    db.execSync('BEGIN TRANSACTION');
    try {
      for (const cat of DEFAULT_CATEGORIES) {
        const id = Crypto.randomUUID();
        db.runSync(
          `INSERT INTO categories (id, name, type, icon, color) VALUES (?, ?, ?, ?, ?)`,
          [id, cat.name, cat.type, cat.icon || null, cat.color || null]
        );
      }
      db.execSync('COMMIT');
    } catch (error) {
      db.execSync('ROLLBACK');
      throw error;
    }
  }
}
