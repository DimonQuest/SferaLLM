// Утилита для безопасной работы с API ключами через electron API

export class SecureApiKeys {
  private static isElectronAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.electronAPI;
  }

  static async saveApiKey(chatId: string, apiKey: string): Promise<void> {
    if (this.isElectronAvailable() && window.electronAPI) {
      await window.electronAPI.secureStorage.setKey(`api_key_${chatId}`, apiKey);
    } else {
      // Fallback для веб-версии (не рекомендуется для продакшена)
      localStorage.setItem(`api_key_${chatId}`, apiKey);
    }
  }

  static async getApiKey(chatId: string): Promise<string | null> {
    if (this.isElectronAvailable() && window.electronAPI) {
      return await window.electronAPI.secureStorage.getKey(`api_key_${chatId}`);
    } else {
      return localStorage.getItem(`api_key_${chatId}`);
    }
  }

  static async deleteApiKey(chatId: string): Promise<void> {
    if (this.isElectronAvailable() && window.electronAPI) {
      await window.electronAPI.secureStorage.deleteKey(`api_key_${chatId}`);
    } else {
      localStorage.removeItem(`api_key_${chatId}`);
    }
  }

  static async hasApiKey(chatId: string): Promise<boolean> {
    if (this.isElectronAvailable() && window.electronAPI) {
      return await window.electronAPI.secureStorage.hasKey(`api_key_${chatId}`);
    } else {
      return localStorage.getItem(`api_key_${chatId}`) !== null;
    }
  }

  // Миграция существующих ключей из localStorage в безопасное хранилище
  static async migrateFromLocalStorage(chats: any[]): Promise<void> {
    if (!this.isElectronAvailable()) return;

    for (const chat of chats) {
      if (chat.config.apiKey) {
        await this.saveApiKey(chat.id, chat.config.apiKey);
        // Не удаляем из конфига сразу, это сделает App.tsx
      }
    }
  }
}
