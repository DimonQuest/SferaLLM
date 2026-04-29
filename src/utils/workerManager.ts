// Web Worker для тяжелых операций (экспорт, подсчет токенов)

export interface WorkerTask {
  type: 'export' | 'tokenCount' | 'search' | 'analyze';
  data: any;
}

export interface WorkerResponse {
  type: string;
  result: any;
  error?: string;
}

class WorkerManager {
  private worker: Worker | null = null;
  private taskQueue: Array<{
    task: WorkerTask;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];
  private isProcessing = false;

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    // Создаем inline worker
    const workerCode = `
      self.onmessage = function(e) {
        const { type, data } = e.data;

        try {
          let result;

          switch(type) {
            case 'tokenCount':
              result = countTokens(data);
              break;
            case 'export':
              result = exportData(data);
              break;
            case 'search':
              result = searchMessages(data);
              break;
            case 'analyze':
              result = analyzeChats(data);
              break;
            default:
              throw new Error('Unknown task type: ' + type);
          }

          self.postMessage({ type, result });
        } catch (error) {
          self.postMessage({ type, error: error.message });
        }
      };

      function countTokens(messages) {
        let total = 0;
        messages.forEach(msg => {
          // Примерный подсчет: 4 символа = 1 токен
          total += Math.ceil(msg.content.length / 4);
        });
        return total;
      }

      function exportData(chats) {
        // Подготовка данных для экспорта
        return chats.map(chat => ({
          name: chat.config.name,
          provider: chat.config.provider,
          model: chat.config.model,
          messages: chat.messages.map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp
          })),
          tokensUsed: chat.tokensUsed
        }));
      }

      function searchMessages(data) {
        const { chats, query } = data;
        const results = [];
        const lowerQuery = query.toLowerCase();

        chats.forEach(chat => {
          chat.messages.forEach(msg => {
            if (msg.content.toLowerCase().includes(lowerQuery)) {
              results.push({
                chatId: chat.id,
                chatName: chat.config.name,
                messageId: msg.id,
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp
              });
            }
          });
        });

        return results;
      }

      function analyzeChats(chats) {
        const stats = {
          totalMessages: 0,
          totalTokens: 0,
          byProvider: {},
          byModel: {},
          messagesByDay: {},
          avgMessageLength: 0
        };

        let totalLength = 0;

        chats.forEach(chat => {
          const provider = chat.config.provider;
          const model = chat.config.model;

          stats.totalMessages += chat.messages.length;
          stats.totalTokens += chat.tokensUsed || 0;

          if (!stats.byProvider[provider]) {
            stats.byProvider[provider] = { messages: 0, tokens: 0 };
          }
          stats.byProvider[provider].messages += chat.messages.length;
          stats.byProvider[provider].tokens += chat.tokensUsed || 0;

          if (!stats.byModel[model]) {
            stats.byModel[model] = { messages: 0, tokens: 0 };
          }
          stats.byModel[model].messages += chat.messages.length;
          stats.byModel[model].tokens += chat.tokensUsed || 0;

          chat.messages.forEach(msg => {
            totalLength += msg.content.length;

            const date = new Date(msg.timestamp).toISOString().split('T')[0];
            if (!stats.messagesByDay[date]) {
              stats.messagesByDay[date] = 0;
            }
            stats.messagesByDay[date]++;
          });
        });

        stats.avgMessageLength = stats.totalMessages > 0
          ? Math.round(totalLength / stats.totalMessages)
          : 0;

        return stats;
      }
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);

    try {
      this.worker = new Worker(workerUrl);
      this.worker.onmessage = this.handleWorkerMessage.bind(this);
      this.worker.onerror = this.handleWorkerError.bind(this);
    } catch (error) {
      console.error('Failed to create worker:', error);
    }
  }

  private handleWorkerMessage(e: MessageEvent<WorkerResponse>) {
    const { type, result, error } = e.data;

    if (this.taskQueue.length > 0) {
      const { task, resolve, reject } = this.taskQueue.shift()!;

      if (error) {
        reject(new Error(error));
      } else {
        resolve(result);
      }
    }

    this.isProcessing = false;
    this.processNextTask();
  }

  private handleWorkerError(error: ErrorEvent) {
    console.error('Worker error:', error);

    if (this.taskQueue.length > 0) {
      const { reject } = this.taskQueue.shift()!;
      reject(error);
    }

    this.isProcessing = false;
    this.processNextTask();
  }

  private processNextTask() {
    if (this.isProcessing || this.taskQueue.length === 0 || !this.worker) {
      return;
    }

    this.isProcessing = true;
    const { task } = this.taskQueue[0];
    this.worker.postMessage(task);
  }

  async executeTask(task: WorkerTask): Promise<any> {
    return new Promise((resolve, reject) => {
      this.taskQueue.push({ task, resolve, reject });
      this.processNextTask();
    });
  }

  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

// Singleton instance
let workerManager: WorkerManager | null = null;

export const getWorkerManager = (): WorkerManager => {
  if (!workerManager) {
    workerManager = new WorkerManager();
  }
  return workerManager;
};

export const terminateWorker = () => {
  if (workerManager) {
    workerManager.terminate();
    workerManager = null;
  }
};

// Удобные функции для использования
export const countTokensAsync = async (messages: any[]): Promise<number> => {
  const manager = getWorkerManager();
  return manager.executeTask({ type: 'tokenCount', data: messages });
};

export const exportDataAsync = async (chats: any[]): Promise<any> => {
  const manager = getWorkerManager();
  return manager.executeTask({ type: 'export', data: chats });
};

export const searchMessagesAsync = async (chats: any[], query: string): Promise<any[]> => {
  const manager = getWorkerManager();
  return manager.executeTask({ type: 'search', data: { chats, query } });
};

export const analyzeChatsAsync = async (chats: any[]): Promise<any> => {
  const manager = getWorkerManager();
  return manager.executeTask({ type: 'analyze', data: chats });
};
