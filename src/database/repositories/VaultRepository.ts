import { db } from '../connection';
import { Vault } from '../schema';
import * as Crypto from 'expo-crypto';

export class VaultRepository {
  static getAll(): Vault[] {
    return db.getAllSync<Vault>('SELECT * FROM vaults ORDER BY createdAt DESC');
  }

  static getById(id: string): Vault | null {
    return db.getFirstSync<Vault>('SELECT * FROM vaults WHERE id = ?', id);
  }

  static create(vault: Omit<Vault, 'id' | 'createdAt' | 'updatedAt' | 'currentAmount'>): Vault {
    const id = Crypto.randomUUID();
    const now = Date.now();
    
    db.runSync(
      `INSERT INTO vaults (id, name, targetAmount, currentAmount, color, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, vault.name, vault.targetAmount, 0, vault.color || null, now, now]
    );

    return { ...vault, id, currentAmount: 0, createdAt: now, updatedAt: now };
  }

  static update(id: string, updates: Partial<Omit<Vault, 'id' | 'createdAt' | 'updatedAt'>>): void {
    const current = this.getById(id);
    if (!current) throw new Error('Vault not found');

    const now = Date.now();
    const updated = { ...current, ...updates };

    db.runSync(
      `UPDATE vaults SET name = ?, targetAmount = ?, currentAmount = ?, color = ?, updatedAt = ? WHERE id = ?`,
      [updated.name, updated.targetAmount, updated.currentAmount, updated.color || null, now, id]
    );
  }

  static addFunds(id: string, amount: number): void {
    const now = Date.now();
    db.runSync(
      'UPDATE vaults SET currentAmount = currentAmount + ?, updatedAt = ? WHERE id = ?',
      [amount, now, id]
    );
  }

  static delete(id: string): void {
    db.runSync('DELETE FROM vaults WHERE id = ?', id);
  }
}
