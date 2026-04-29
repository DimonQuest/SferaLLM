// Утилита для desktop уведомлений

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
}

export class NotificationManager {
  private static isElectron = typeof window !== 'undefined' && window.electronAPI;
  private static permission: NotificationPermission = 'default';

  static async init(): Promise<boolean> {
    if (this.isElectron) {
      // В Electron уведомления всегда доступны
      this.permission = 'granted';
      return true;
    }

    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications');
      return false;
    }

    this.permission = Notification.permission;

    if (this.permission === 'default') {
      this.permission = await Notification.requestPermission();
    }

    return this.permission === 'granted';
  }

  static async show(options: NotificationOptions): Promise<void> {
    if (this.permission !== 'granted') {
      const granted = await this.init();
      if (!granted) {
        console.warn('Notification permission denied');
        return;
      }
    }

    if (this.isElectron && window.electronAPI) {
      // Используем Electron API
      await window.electronAPI.notification.show(options.title, options.body);
    } else {
      // Используем Web Notifications API
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/icon.png',
        tag: options.tag,
        requireInteraction: options.requireInteraction,
        silent: options.silent
      });

      // Автоматически закрываем через 5 секунд
      if (!options.requireInteraction) {
        setTimeout(() => notification.close(), 5000);
      }
    }
  }

  static async notifyResponseComplete(chatName: string, preview: string): Promise<void> {
    await this.show({
      title: `${chatName} - Ответ получен`,
      body: preview.length > 100 ? preview.substring(0, 100) + '...' : preview,
      tag: 'response-complete',
      silent: false
    });
  }

  static async notifyError(chatName: string, error: string): Promise<void> {
    await this.show({
      title: `${chatName} - Ошибка`,
      body: error,
      tag: 'error',
      requireInteraction: true,
      silent: false
    });
  }

  static async notifyAllResponsesComplete(count: number): Promise<void> {
    await this.show({
      title: 'Все ответы получены',
      body: `Получено ${count} ответов от разных моделей`,
      tag: 'all-complete',
      silent: false
    });
  }

  static async notifyRateLimitWarning(provider: string, resetIn: number): Promise<void> {
    const minutes = Math.ceil(resetIn / 60000);
    await this.show({
      title: 'Предупреждение о лимите',
      body: `Приближается лимит запросов для ${provider}. Сброс через ${minutes} мин.`,
      tag: 'rate-limit-warning',
      silent: true
    });
  }

  static async notifyCacheHit(prompt: string): Promise<void> {
    await this.show({
      title: 'Ответ из кэша',
      body: 'Найден сохраненный ответ на похожий запрос',
      tag: 'cache-hit',
      silent: true
    });
  }

  static isSupported(): boolean {
    return !!this.isElectron || ('Notification' in window);
  }

  static getPermission(): NotificationPermission {
    return this.permission;
  }
}
