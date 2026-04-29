import { Message } from '../types';

const MESSAGE_BATCH_SIZE = 50;
const STORAGE_PREFIX = 'chat-messages-';

export class MessagePagination {
  static saveMessages(chatId: string, messages: Message[]) {
    try {
      // Сохраняем последние MESSAGE_BATCH_SIZE сообщений в основное хранилище
      const recentMessages = messages.slice(-MESSAGE_BATCH_SIZE);

      // Остальные сообщения сохраняем в архив
      if (messages.length > MESSAGE_BATCH_SIZE) {
        const archivedMessages = messages.slice(0, -MESSAGE_BATCH_SIZE);
        const batches = this.splitIntoBatches(archivedMessages, MESSAGE_BATCH_SIZE);

        batches.forEach((batch, index) => {
          const key = `${STORAGE_PREFIX}${chatId}-batch-${index}`;
          localStorage.setItem(key, JSON.stringify(batch));
        });

        // Сохраняем количество батчей
        localStorage.setItem(`${STORAGE_PREFIX}${chatId}-batches`, batches.length.toString());
      }

      return recentMessages;
    } catch (error) {
      console.error('Failed to save messages:', error);
      return messages;
    }
  }

  static loadMessages(chatId: string, recentMessages: Message[]): Message[] {
    try {
      const batchCount = parseInt(localStorage.getItem(`${STORAGE_PREFIX}${chatId}-batches`) || '0');

      if (batchCount === 0) {
        return recentMessages;
      }

      const allMessages: Message[] = [];

      // Загружаем все батчи
      for (let i = 0; i < batchCount; i++) {
        const key = `${STORAGE_PREFIX}${chatId}-batch-${i}`;
        const batch = localStorage.getItem(key);
        if (batch) {
          allMessages.push(...JSON.parse(batch));
        }
      }

      // Добавляем последние сообщения
      allMessages.push(...recentMessages);

      return allMessages;
    } catch (error) {
      console.error('Failed to load messages:', error);
      return recentMessages;
    }
  }

  static loadRecentMessages(chatId: string, count: number = MESSAGE_BATCH_SIZE): Message[] {
    try {
      const batchCount = parseInt(localStorage.getItem(`${STORAGE_PREFIX}${chatId}-batches`) || '0');

      if (batchCount === 0) {
        return [];
      }

      // Загружаем только последний батч
      const lastBatchKey = `${STORAGE_PREFIX}${chatId}-batch-${batchCount - 1}`;
      const lastBatch = localStorage.getItem(lastBatchKey);

      if (lastBatch) {
        const messages = JSON.parse(lastBatch);
        return messages.slice(-count);
      }

      return [];
    } catch (error) {
      console.error('Failed to load recent messages:', error);
      return [];
    }
  }

  static clearMessages(chatId: string) {
    try {
      const batchCount = parseInt(localStorage.getItem(`${STORAGE_PREFIX}${chatId}-batches`) || '0');

      for (let i = 0; i < batchCount; i++) {
        const key = `${STORAGE_PREFIX}${chatId}-batch-${i}`;
        localStorage.removeItem(key);
      }

      localStorage.removeItem(`${STORAGE_PREFIX}${chatId}-batches`);
    } catch (error) {
      console.error('Failed to clear messages:', error);
    }
  }

  private static splitIntoBatches(messages: Message[], batchSize: number): Message[][] {
    const batches: Message[][] = [];

    for (let i = 0; i < messages.length; i += batchSize) {
      batches.push(messages.slice(i, i + batchSize));
    }

    return batches;
  }

  static getStorageSize(chatId: string): number {
    try {
      let totalSize = 0;
      const batchCount = parseInt(localStorage.getItem(`${STORAGE_PREFIX}${chatId}-batches`) || '0');

      for (let i = 0; i < batchCount; i++) {
        const key = `${STORAGE_PREFIX}${chatId}-batch-${i}`;
        const item = localStorage.getItem(key);
        if (item) {
          totalSize += item.length;
        }
      }

      return totalSize;
    } catch (error) {
      console.error('Failed to get storage size:', error);
      return 0;
    }
  }

  static optimizeStorage(chatId: string, maxMessages: number = 1000) {
    try {
      const allMessages = this.loadMessages(chatId, []);

      if (allMessages.length > maxMessages) {
        const trimmedMessages = allMessages.slice(-maxMessages);
        this.clearMessages(chatId);
        this.saveMessages(chatId, trimmedMessages);
      }
    } catch (error) {
      console.error('Failed to optimize storage:', error);
    }
  }
}
