import { Chat } from '../types';

const DRAFT_KEY = 'chat-drafts';
const BACKUP_KEY = 'chat-backup';
const CRASH_RECOVERY_KEY = 'crash-recovery';

export interface ChatDraft {
  chatId: string;
  content: string;
  timestamp: number;
}

export class AutoSaveManager {
  private static saveInterval: NodeJS.Timeout | null = null;
  private static debounceTimer: NodeJS.Timeout | null = null;
  private static lastSaveTime: number = 0;
  private static readonly MIN_SAVE_INTERVAL = 5000; // Минимум 5 секунд между сохранениями

  static startAutoSave(getChats: () => Chat[], interval: number = 30000) {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
    }

    this.saveInterval = setInterval(() => {
      const chats = getChats();
      this.createBackup(chats);
    }, interval);

    // Сохраняем при закрытии окна
    window.addEventListener('beforeunload', () => {
      const chats = getChats();
      this.createBackup(chats);
      this.markCleanExit();
    });
  }

  // Debounced сохранение для частых изменений
  static debouncedSave(getChats: () => Chat[], delay: number = 2000) {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      const now = Date.now();
      // Проверяем минимальный интервал между сохранениями
      if (now - this.lastSaveTime >= this.MIN_SAVE_INTERVAL) {
        const chats = getChats();
        this.createBackup(chats);
        this.lastSaveTime = now;
      }
    }, delay);
  }

  static stopAutoSave() {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
      this.saveInterval = null;
    }
  }

  static createBackup(chats: Chat[]) {
    try {
      const backup = {
        chats,
        timestamp: Date.now(),
        version: '2.0.0'
      };
      localStorage.setItem(BACKUP_KEY, JSON.stringify(backup));
    } catch (error) {
      console.error('Failed to create backup:', error);
    }
  }

  static getBackup(): { chats: Chat[]; timestamp: number } | null {
    try {
      const backup = localStorage.getItem(BACKUP_KEY);
      if (!backup) return null;
      return JSON.parse(backup);
    } catch (error) {
      console.error('Failed to load backup:', error);
      return null;
    }
  }

  private static draftDebounceTimers: Map<string, NodeJS.Timeout> = new Map();

  static saveDraft(chatId: string, content: string, debounce: boolean = true) {
    if (debounce) {
      // Debounce для каждого чата отдельно
      const existingTimer = this.draftDebounceTimers.get(chatId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(() => {
        this.saveDraftImmediate(chatId, content);
        this.draftDebounceTimers.delete(chatId);
      }, 1000);

      this.draftDebounceTimers.set(chatId, timer);
    } else {
      this.saveDraftImmediate(chatId, content);
    }
  }

  private static saveDraftImmediate(chatId: string, content: string) {
    try {
      const drafts = this.getDrafts();
      const existingIndex = drafts.findIndex(d => d.chatId === chatId);

      const draft: ChatDraft = {
        chatId,
        content,
        timestamp: Date.now()
      };

      if (existingIndex >= 0) {
        drafts[existingIndex] = draft;
      } else {
        drafts.push(draft);
      }

      localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts));
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }

  static getDraft(chatId: string): string | null {
    const drafts = this.getDrafts();
    const draft = drafts.find(d => d.chatId === chatId);
    return draft ? draft.content : null;
  }

  static getDrafts(): ChatDraft[] {
    try {
      const drafts = localStorage.getItem(DRAFT_KEY);
      return drafts ? JSON.parse(drafts) : [];
    } catch (error) {
      console.error('Failed to load drafts:', error);
      return [];
    }
  }

  static clearDraft(chatId: string) {
    try {
      const drafts = this.getDrafts().filter(d => d.chatId !== chatId);
      localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts));
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }

  static markCleanExit() {
    localStorage.setItem(CRASH_RECOVERY_KEY, 'clean');
  }

  static checkCrashRecovery(): boolean {
    const status = localStorage.getItem(CRASH_RECOVERY_KEY);
    const needsRecovery = status !== 'clean';

    // Сразу помечаем как чистый запуск для следующего раза
    localStorage.setItem(CRASH_RECOVERY_KEY, 'running');

    return needsRecovery;
  }

  static clearOldDrafts(maxAge: number = 7 * 24 * 60 * 60 * 1000) {
    const drafts = this.getDrafts();
    const now = Date.now();
    const filtered = drafts.filter(d => now - d.timestamp < maxAge);
    localStorage.setItem(DRAFT_KEY, JSON.stringify(filtered));
  }
}
