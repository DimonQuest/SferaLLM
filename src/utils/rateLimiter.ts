// Rate limiting для защиты от превышения лимитов API

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  provider?: string;
}

interface RequestRecord {
  timestamp: number;
  provider: string;
}

export class RateLimiter {
  private static requests: RequestRecord[] = [];

  // Лимиты по умолчанию для разных провайдеров (запросов в минуту)
  private static readonly DEFAULT_LIMITS: Record<string, RateLimitConfig> = {
    openai: { maxRequests: 60, windowMs: 60000 },
    anthropic: { maxRequests: 50, windowMs: 60000 },
    google: { maxRequests: 60, windowMs: 60000 },
    mistral: { maxRequests: 60, windowMs: 60000 },
    cohere: { maxRequests: 100, windowMs: 60000 },
    perplexity: { maxRequests: 50, windowMs: 60000 },
    groq: { maxRequests: 30, windowMs: 60000 },
    xai: { maxRequests: 60, windowMs: 60000 },
    deepseek: { maxRequests: 60, windowMs: 60000 },
    openrouter: { maxRequests: 200, windowMs: 60000 },
    omniroute: { maxRequests: 1000, windowMs: 60000 },
    '9route': { maxRequests: 1000, windowMs: 60000 },
    custom: { maxRequests: 60, windowMs: 60000 }
  };

  static async checkLimit(provider: string): Promise<boolean> {
    const config = this.DEFAULT_LIMITS[provider] || this.DEFAULT_LIMITS.custom;
    const now = Date.now();

    // Очищаем старые записи
    this.requests = this.requests.filter(
      req => now - req.timestamp < config.windowMs && req.provider === provider
    );

    // Проверяем лимит
    if (this.requests.length >= config.maxRequests) {
      return false;
    }

    return true;
  }

  static async waitForSlot(provider: string): Promise<void> {
    const config = this.DEFAULT_LIMITS[provider] || this.DEFAULT_LIMITS.custom;

    while (!(await this.checkLimit(provider))) {
      // Находим самый старый запрос
      const oldestRequest = this.requests
        .filter(req => req.provider === provider)
        .sort((a, b) => a.timestamp - b.timestamp)[0];

      if (oldestRequest) {
        const waitTime = config.windowMs - (Date.now() - oldestRequest.timestamp);
        if (waitTime > 0) {
          await new Promise(resolve => setTimeout(resolve, waitTime + 100));
        }
      } else {
        break;
      }
    }
  }

  static recordRequest(provider: string): void {
    this.requests.push({
      timestamp: Date.now(),
      provider
    });
  }

  static async executeWithRateLimit<T>(
    provider: string,
    fn: () => Promise<T>
  ): Promise<T> {
    await this.waitForSlot(provider);
    this.recordRequest(provider);
    return await fn();
  }

  static getStats(provider: string): { current: number; limit: number; resetIn: number } {
    const config = this.DEFAULT_LIMITS[provider] || this.DEFAULT_LIMITS.custom;
    const now = Date.now();

    const recentRequests = this.requests.filter(
      req => now - req.timestamp < config.windowMs && req.provider === provider
    );

    const oldestRequest = recentRequests.sort((a, b) => a.timestamp - b.timestamp)[0];
    const resetIn = oldestRequest
      ? Math.max(0, config.windowMs - (now - oldestRequest.timestamp))
      : 0;

    return {
      current: recentRequests.length,
      limit: config.maxRequests,
      resetIn
    };
  }

  static setCustomLimit(provider: string, config: RateLimitConfig): void {
    this.DEFAULT_LIMITS[provider] = config;
  }
}
