// Кэширование ответов для экономии токенов и ускорения повторных запросов

export interface CacheEntry {
  prompt: string;
  response: string;
  model: string;
  provider: string;
  timestamp: number;
  tokensUsed: number;
}

export class ResponseCache {
  private static readonly CACHE_KEY = 'response-cache';
  private static readonly MAX_CACHE_SIZE = 100;
  private static readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 часа

  private static cache: Map<string, CacheEntry> = new Map();
  private static initialized = false;

  private static init(): void {
    if (this.initialized) return;

    try {
      const stored = localStorage.getItem(this.CACHE_KEY);
      if (stored) {
        const entries: [string, CacheEntry][] = JSON.parse(stored);
        this.cache = new Map(entries);
        this.cleanExpired();
      }
    } catch (error) {
      console.error('Failed to load cache:', error);
    }

    this.initialized = true;
  }

  private static generateKey(prompt: string, model: string, provider: string): string {
    // Нормализуем промпт (убираем лишние пробелы)
    const normalized = prompt.trim().toLowerCase().replace(/\s+/g, ' ');
    return `${provider}:${model}:${normalized}`;
  }

  private static cleanExpired(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > this.CACHE_TTL) {
        toDelete.push(key);
      }
    });

    toDelete.forEach(key => this.cache.delete(key));
  }

  private static enforceSize(): void {
    if (this.cache.size <= this.MAX_CACHE_SIZE) return;

    // Удаляем самые старые записи
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);

    const toDelete = entries.slice(0, this.cache.size - this.MAX_CACHE_SIZE);
    toDelete.forEach(([key]) => this.cache.delete(key));
  }

  private static save(): void {
    try {
      const entries = Array.from(this.cache.entries());
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('Failed to save cache:', error);
    }
  }

  static get(prompt: string, model: string, provider: string): string | null {
    this.init();
    const key = this.generateKey(prompt, model, provider);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Проверяем TTL
    if (Date.now() - entry.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      this.save();
      return null;
    }

    return entry.response;
  }

  static set(
    prompt: string,
    response: string,
    model: string,
    provider: string,
    tokensUsed: number
  ): void {
    this.init();
    const key = this.generateKey(prompt, model, provider);

    this.cache.set(key, {
      prompt,
      response,
      model,
      provider,
      timestamp: Date.now(),
      tokensUsed
    });

    this.enforceSize();
    this.save();
  }

  static has(prompt: string, model: string, provider: string): boolean {
    return this.get(prompt, model, provider) !== null;
  }

  static clear(): void {
    this.cache.clear();
    localStorage.removeItem(this.CACHE_KEY);
  }

  static getStats(): {
    size: number;
    totalTokensSaved: number;
    oldestEntry: number | null;
  } {
    this.init();
    this.cleanExpired();

    let totalTokensSaved = 0;
    let oldestTimestamp: number | null = null;

    this.cache.forEach(entry => {
      totalTokensSaved += entry.tokensUsed;
      if (!oldestTimestamp || entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
      }
    });

    return {
      size: this.cache.size,
      totalTokensSaved,
      oldestEntry: oldestTimestamp
    };
  }

  static clearExpired(): void {
    this.init();
    this.cleanExpired();
    this.save();
  }

  // Поиск похожих запросов (для подсказок)
  static findSimilar(prompt: string, limit: number = 5): CacheEntry[] {
    this.init();
    const normalized = prompt.trim().toLowerCase();
    const results: Array<{ entry: CacheEntry; score: number }> = [];

    this.cache.forEach(entry => {
      const entryPrompt = entry.prompt.toLowerCase();
      if (entryPrompt.includes(normalized) || normalized.includes(entryPrompt)) {
        const score = this.calculateSimilarity(normalized, entryPrompt);
        results.push({ entry, score });
      }
    });

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(r => r.entry);
  }

  private static calculateSimilarity(str1: string, str2: string): number {
    const words1 = new Set(str1.split(/\s+/));
    const words2 = new Set(str2.split(/\s+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
  }
}
