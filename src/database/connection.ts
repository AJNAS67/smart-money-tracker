import * as SQLite from 'expo-sqlite';

// Open the database synchronously
export const db = SQLite.openDatabaseSync('moneyflow.db');

export const initDatabase = async () => {
  try {
    // We execute the pragmas and table creations in one go
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        balance REAL NOT NULL DEFAULT 0,
        creditLimit REAL,
        billPaymentDate INTEGER,
        dueDate INTEGER,
        bankName TEXT,
        last4Digits TEXT,
        expiryDate TEXT,
        remarks TEXT,
        icon TEXT,
        color TEXT,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        icon TEXT,
        color TEXT
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        accountId TEXT NOT NULL,
        categoryId TEXT,
        amount REAL NOT NULL,
        type TEXT NOT NULL,
        date INTEGER NOT NULL,
        note TEXT,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        FOREIGN KEY(accountId) REFERENCES accounts(id) ON DELETE CASCADE,
        FOREIGN KEY(categoryId) REFERENCES categories(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS budgets (
        id TEXT PRIMARY KEY,
        categoryId TEXT NOT NULL,
        limitAmount REAL NOT NULL,
        period TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        FOREIGN KEY(categoryId) REFERENCES categories(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS vaults (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        targetAmount REAL NOT NULL,
        currentAmount REAL NOT NULL DEFAULT 0,
        color TEXT,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      );
    `);
    
    // Add columns dynamically if the table was created before the schema was updated
    try {
      await db.execAsync(`
        ALTER TABLE accounts ADD COLUMN creditLimit REAL;
      `);
    } catch (e) {}
    try {
      await db.execAsync(`
        ALTER TABLE accounts ADD COLUMN billPaymentDate INTEGER;
      `);
    } catch (e) {}
    try {
      await db.execAsync(`
        ALTER TABLE accounts ADD COLUMN dueDate INTEGER;
      `);
    } catch (e) {}
    try {
      await db.execAsync(`
        ALTER TABLE accounts ADD COLUMN bankName TEXT;
      `);
    } catch (e) {}
    try {
      await db.execAsync(`
        ALTER TABLE accounts ADD COLUMN last4Digits TEXT;
      `);
    } catch (e) {}
    try {
      await db.execAsync(`
        ALTER TABLE accounts ADD COLUMN expiryDate TEXT;
      `);
    } catch (e) {}
    try {
      await db.execAsync(`
        ALTER TABLE accounts ADD COLUMN remarks TEXT;
      `);
    } catch (e) {}

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};
