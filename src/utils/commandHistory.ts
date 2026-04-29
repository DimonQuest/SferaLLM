// Утилита для управления историей команд (промптов)

export class CommandHistory {
  private static readonly STORAGE_KEY = 'command-history';
  private static readonly MAX_HISTORY = 100;
  private static history: string[] = [];
  private static currentIndex: number = -1;
  private static initialized = false;

  private static init(): void {
    if (this.initialized) return;

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.history = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load command history:', error);
    }

    this.initialized = true;
  }

  static addCommand(command: string): void {
    this.init();

    // Игнорируем пустые команды
    if (!command.trim()) return;

    // Удаляем дубликаты (если команда уже есть в истории)
    this.history = this.history.filter(cmd => cmd !== command);

    // Добавляем в начало
    this.history.unshift(command);

    // Ограничиваем размер истории
    if (this.history.length > this.MAX_HISTORY) {
      this.history = this.history.slice(0, this.MAX_HISTORY);
    }

    // Сбрасываем индекс
    this.currentIndex = -1;

    this.save();
  }

  static getPrevious(currentText: string = ''): string | null {
    this.init();

    if (this.history.length === 0) return null;

    // Если мы в начале истории, сохраняем текущий текст
    if (this.currentIndex === -1 && currentText.trim()) {
      // Временно сохраняем текущий ввод
      this.history.unshift(currentText);
      this.currentIndex = 0;
    }

    // Переходим к предыдущей команде
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      return this.history[this.currentIndex];
    }

    return this.history[this.currentIndex];
  }

  static getNext(): string | null {
    this.init();

    if (this.currentIndex <= 0) {
      this.currentIndex = -1;
      return '';
    }

    this.currentIndex--;
    return this.history[this.currentIndex];
  }

  static reset(): void {
    this.currentIndex = -1;
  }

  static getAll(): string[] {
    this.init();
    return [...this.history];
  }

  static search(query: string): string[] {
    this.init();
    const lowerQuery = query.toLowerCase();
    return this.history.filter(cmd =>
      cmd.toLowerCase().includes(lowerQuery)
    );
  }

  static clear(): void {
    this.history = [];
    this.currentIndex = -1;
    localStorage.removeItem(this.STORAGE_KEY);
  }

  private static save(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.history));
    } catch (error) {
      console.error('Failed to save command history:', error);
    }
  }

  static getStats(): { total: number; unique: number } {
    this.init();
    const unique = new Set(this.history);
    return {
      total: this.history.length,
      unique: unique.size
    };
  }

  // Экспорт истории
  static export(): string {
    this.init();
    return JSON.stringify(this.history, null, 2);
  }

  // Импорт истории
  static import(data: string): boolean {
    try {
      const imported = JSON.parse(data);
      if (Array.isArray(imported)) {
        this.history = imported.slice(0, this.MAX_HISTORY);
        this.save();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to import command history:', error);
      return false;
    }
  }
}
