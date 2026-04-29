// Retry логика с exponential backoff для API запросов

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableStatuses?: number[];
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504]
};

export class RetryHandler {
  static async fetchWithRetry(
    url: string,
    options: RequestInit,
    retryOptions: RetryOptions = {}
  ): Promise<Response> {
    const opts = { ...DEFAULT_OPTIONS, ...retryOptions };
    let lastError: Error | null = null;
    let delay = opts.initialDelay;

    for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
      try {
        const response = await fetch(url, options);

        // Если ответ успешный, возвращаем его
        if (response.ok) {
          return response;
        }

        // Проверяем, стоит ли повторять запрос
        if (!opts.retryableStatuses.includes(response.status)) {
          return response; // Не повторяем для не-retryable статусов
        }

        // Если это последняя попытка, возвращаем ответ как есть
        if (attempt === opts.maxRetries) {
          return response;
        }

        // Для 429 (Rate Limit) проверяем заголовок Retry-After
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          if (retryAfter) {
            const retryDelay = parseInt(retryAfter) * 1000;
            await this.sleep(Math.min(retryDelay, opts.maxDelay));
            continue;
          }
        }

        // Ждем перед следующей попыткой
        await this.sleep(delay);
        delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelay);

      } catch (error) {
        lastError = error as Error;

        // Если это последняя попытка, выбрасываем ошибку
        if (attempt === opts.maxRetries) {
          throw lastError;
        }

        // Ждем перед следующей попыткой
        await this.sleep(delay);
        delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelay);
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Специальная версия для streaming запросов
  static async fetchStreamWithRetry(
    url: string,
    options: RequestInit,
    retryOptions: RetryOptions = {}
  ): Promise<Response> {
    const opts = { ...DEFAULT_OPTIONS, ...retryOptions };
    let lastError: Error | null = null;
    let delay = opts.initialDelay;

    for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
      try {
        const response = await fetch(url, options);

        // Для streaming проверяем только статус, не читаем body
        if (response.ok || !opts.retryableStatuses.includes(response.status)) {
          return response;
        }

        if (attempt === opts.maxRetries) {
          return response;
        }

        await this.sleep(delay);
        delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelay);

      } catch (error) {
        lastError = error as Error;

        if (attempt === opts.maxRetries) {
          throw lastError;
        }

        await this.sleep(delay);
        delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelay);
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }
}
