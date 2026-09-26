import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system';
import { db } from '../database/connection';
import { AccountRepository, TransactionRepository, CategoryRepository, BudgetRepository, VaultRepository } from '../database';

const PIN_KEY = 'moneyflow_app_pin';
const IS_LOCKED_KEY = 'moneyflow_is_locked';

export class SettingsService {
  static async setPin(pin: string): Promise<void> {
    await SecureStore.setItemAsync(PIN_KEY, pin);
  }

  static async verifyPin(pin: string): Promise<boolean> {
    const storedPin = await SecureStore.getItemAsync(PIN_KEY);
    return storedPin === pin;
  }

  static async hasPinSetup(): Promise<boolean> {
    const storedPin = await SecureStore.getItemAsync(PIN_KEY);
    return storedPin !== null;
  }

  static async removePin(): Promise<void> {
    await SecureStore.deleteItemAsync(PIN_KEY);
  }

  static async setAppLocked(locked: boolean): Promise<void> {
    await SecureStore.setItemAsync(IS_LOCKED_KEY, locked ? 'true' : 'false');
  }

  static async isAppLocked(): Promise<boolean> {
    const isLocked = await SecureStore.getItemAsync(IS_LOCKED_KEY);
    return isLocked === 'true';
  }

  static async exportDatabase(): Promise<string> {
    try {
      // Create a JSON backup of all tables
      const backup = {
        accounts: AccountRepository.getAll(),
        transactions: TransactionRepository.getAll(),
        categories: CategoryRepository.getAll(),
        budgets: BudgetRepository.getAll(),
        vaults: VaultRepository.getAll(),
      };

      const backupString = JSON.stringify(backup, null, 2);
      const filename = `moneyflow_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      await FileSystem.writeAsStringAsync(fileUri, backupString, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      return fileUri;
    } catch (error) {
      console.error('Error exporting database:', error);
      throw error;
    }
  }
}
