// Система разрешений для работы с файловой системой

export type PermissionType =
  | 'read-file'
  | 'write-file'
  | 'edit-file'
  | 'delete-file'
  | 'list-directory'
  | 'execute-command'
  | 'create-directory'
  | 'search-files';

export interface Permission {
  type: PermissionType;
  path?: string;
  pattern?: string;
  granted: boolean;
  timestamp: number;
  chatId: string;
}

export interface PermissionRequest {
  type: PermissionType;
  path: string;
  reason: string;
  action: string;
}

export class PermissionManager {
  private static readonly STORAGE_KEY = 'fs-permissions';
  private static permissions: Map<string, Permission[]> = new Map();

  static init(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.permissions = new Map(Object.entries(data));
      }
    } catch (error) {
      console.error('Failed to load permissions:', error);
    }
  }

  static async requestPermission(
    chatId: string,
    request: PermissionRequest
  ): Promise<boolean> {
    // Проверяем, есть ли уже разрешение
    if (this.hasPermission(chatId, request.type, request.path)) {
      return true;
    }

    // Показываем диалог пользователю
    const granted = await this.showPermissionDialog(request);

    if (granted) {
      this.grantPermission(chatId, request.type, request.path);
    }

    return granted;
  }

  private static async showPermissionDialog(
    request: PermissionRequest
  ): Promise<boolean> {
    const message = this.formatPermissionMessage(request);
    return confirm(message);
  }

  private static formatPermissionMessage(request: PermissionRequest): string {
    const actions: Record<PermissionType, string> = {
      'read-file': 'прочитать файл',
      'write-file': 'записать файл',
      'edit-file': 'изменить файл',
      'delete-file': 'удалить файл',
      'list-directory': 'просмотреть содержимое папки',
      'execute-command': 'выполнить команду',
      'create-directory': 'создать папку',
      'search-files': 'искать файлы'
    };

    return `AI хочет ${actions[request.type]}:\n\n` +
           `Путь: ${request.path}\n` +
           `Причина: ${request.reason}\n` +
           `Действие: ${request.action}\n\n` +
           `Разрешить?`;
  }

  static grantPermission(
    chatId: string,
    type: PermissionType,
    path?: string
  ): void {
    const chatPermissions = this.permissions.get(chatId) || [];

    chatPermissions.push({
      type,
      path,
      granted: true,
      timestamp: Date.now(),
      chatId
    });

    this.permissions.set(chatId, chatPermissions);
    this.save();
  }

  static hasPermission(
    chatId: string,
    type: PermissionType,
    path?: string
  ): boolean {
    const chatPermissions = this.permissions.get(chatId) || [];

    return chatPermissions.some(p => {
      if (p.type !== type) return false;
      if (!p.granted) return false;

      // Если путь не указан, проверяем общее разрешение
      if (!path || !p.path) return true;

      // Проверяем точное совпадение или родительскую папку
      return path.startsWith(p.path);
    });
  }

  static revokePermission(chatId: string, type: PermissionType): void {
    const chatPermissions = this.permissions.get(chatId) || [];
    const filtered = chatPermissions.filter(p => p.type !== type);
    this.permissions.set(chatId, filtered);
    this.save();
  }

  static revokeAllPermissions(chatId: string): void {
    this.permissions.delete(chatId);
    this.save();
  }

  static getPermissions(chatId: string): Permission[] {
    return this.permissions.get(chatId) || [];
  }

  private static save(): void {
    try {
      const data = Object.fromEntries(this.permissions);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save permissions:', error);
    }
  }

  static clearExpired(maxAge: number = 24 * 60 * 60 * 1000): void {
    const now = Date.now();

    this.permissions.forEach((permissions, chatId) => {
      const filtered = permissions.filter(p => now - p.timestamp < maxAge);
      if (filtered.length === 0) {
        this.permissions.delete(chatId);
      } else {
        this.permissions.set(chatId, filtered);
      }
    });

    this.save();
  }
}

// Инициализация при загрузке
PermissionManager.init();
