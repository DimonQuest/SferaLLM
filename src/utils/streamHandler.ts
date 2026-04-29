// Streaming ответов (SSE) для более быстрого отклика

export interface StreamOptions {
  onChunk: (chunk: string) => void;
  onComplete: (fullText: string) => void;
  onError: (error: Error) => void;
  signal?: AbortSignal;
}

export class StreamHandler {
  static async streamOpenAICompatible(
    url: string,
    headers: Record<string, string>,
    body: any,
    options: StreamOptions
  ): Promise<void> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...body,
          stream: true
        }),
        signal: options.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              if (content) {
                fullText += content;
                options.onChunk(content);
              }
            } catch (e) {
              // Игнорируем ошибки парсинга отдельных чанков
            }
          }
        }
      }

      options.onComplete(fullText);
    } catch (error) {
      options.onError(error as Error);
    }
  }

  static async streamAnthropic(
    url: string,
    headers: Record<string, string>,
    body: any,
    options: StreamOptions
  ): Promise<void> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          ...body,
          stream: true
        }),
        signal: options.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'content_block_delta') {
                const content = parsed.delta?.text || '';
                if (content) {
                  fullText += content;
                  options.onChunk(content);
                }
              }
            } catch (e) {
              // Игнорируем ошибки парсинга
            }
          }
        }
      }

      options.onComplete(fullText);
    } catch (error) {
      options.onError(error as Error);
    }
  }

  static async streamResponse(
    provider: string,
    url: string,
    headers: Record<string, string>,
    body: any,
    options: StreamOptions
  ): Promise<void> {
    if (provider === 'anthropic') {
      return this.streamAnthropic(url, headers, body, options);
    } else {
      // OpenAI-совместимый формат для остальных провайдеров
      return this.streamOpenAICompatible(url, headers, body, options);
    }
  }

  // Утилита для создания AbortController с таймаутом
  static createAbortController(timeoutMs: number = 60000): AbortController {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), timeoutMs);
    return controller;
  }
}
