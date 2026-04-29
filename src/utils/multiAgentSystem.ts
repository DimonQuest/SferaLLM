// Multi-Agent System для совместной работы AI
import { Chat, Message, ChatConfig } from '../types';
import { getMaxTokensForLength } from '../types/settings';

export type CollaborationMode = 'normal' | 'collaborative' | 'orchestrator';

interface AgentResponse {
  chatId: string;
  chatName: string;
  content: string;
  timestamp: number;
}

export class MultiAgentSystem {
  /**
   * Обычный режим - все AI отвечают параллельно
   */
  static async normalMode(
    message: string,
    enabledChats: Chat[],
    maxTokens: number,
    getApiUrl: (config: ChatConfig) => string
  ): Promise<AgentResponse[]> {
    const requests = enabledChats.map(async (chat) => {
      try {
        const userMessage = {
          role: 'user',
          content: message
        };

        const apiMessages = [...chat.messages.map(m => ({
          role: m.role,
          content: m.content
        })), userMessage];

        const response = await fetch(getApiUrl(chat.config), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${chat.config.apiKey}`
          },
          body: JSON.stringify({
            model: chat.config.model,
            messages: apiMessages,
            temperature: chat.config.temperature || 0.7,
            max_tokens: maxTokens,
            stream: false
          })
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content || data.content?.[0]?.text || 'No response';

          return {
            chatId: chat.id,
            chatName: chat.config.name,
            content,
            timestamp: Date.now()
          };
        }
      } catch (error) {
        console.error(`Error in chat ${chat.config.name}:`, error);
      }

      return {
        chatId: chat.id,
        chatName: chat.config.name,
        content: '❌ Ошибка получения ответа',
        timestamp: Date.now()
      };
    });

    return await Promise.all(requests);
  }

  /**
   * Режим совместной работы - AI обсуждают между собой
   */
  static async collaborativeMode(
    message: string,
    enabledChats: Chat[],
    maxTokens: number,
    getApiUrl: (config: ChatConfig) => string,
    onRoundUpdate?: (round: number, responses: AgentResponse[]) => void
  ): Promise<AgentResponse[]> {
    const rounds = 3; // Количество раундов обсуждения
    let allResponses: AgentResponse[][] = [];

    // Раунд 1: Все AI получают исходный вопрос
    const round1Responses = await this.normalMode(message, enabledChats, maxTokens, getApiUrl);
    allResponses.push(round1Responses);
    onRoundUpdate?.(1, round1Responses);

    // Раунды 2-3: AI видят ответы других и комментируют
    for (let round = 2; round <= rounds; round++) {
      const previousResponses = allResponses[round - 2];

      // Формируем контекст с ответами других AI
      const context = previousResponses
        .map(r => `**${r.chatName}**: ${r.content}`)
        .join('\n\n');

      const roundPrompt = round === 2
        ? `Исходный вопрос: "${message}"\n\nОтветы других AI:\n${context}\n\nПроанализируй эти ответы. Что хорошо? Что можно улучшить? Предложи свои дополнения.`
        : `Исходный вопрос: "${message}"\n\nПредыдущее обсуждение:\n${context}\n\nНа основе всего обсуждения, сформулируй финальные рекомендации и лучшие идеи.`;

      const roundResponses = await this.normalMode(roundPrompt, enabledChats, maxTokens, getApiUrl);
      allResponses.push(roundResponses);
      onRoundUpdate?.(round, roundResponses);
    }

    // Возвращаем финальный раунд
    return allResponses[allResponses.length - 1];
  }

  /**
   * Режим оркестратора - главный AI координирует работу
   */
  static async orchestratorMode(
    message: string,
    enabledChats: Chat[],
    orchestratorId: string,
    maxTokens: number,
    getApiUrl: (config: ChatConfig) => string,
    onStepUpdate?: (step: string, data: any) => void
  ): Promise<AgentResponse[]> {
    const orchestrator = enabledChats.find(c => c.id === orchestratorId);
    const workers = enabledChats.filter(c => c.id !== orchestratorId);

    if (!orchestrator) {
      throw new Error('Orchestrator not found');
    }

    // Шаг 1: Оркестратор разбивает задачу на подзадачи
    onStepUpdate?.('planning', { orchestrator: orchestrator.config.name });

    const planningPrompt = `Ты - координатор команды AI. Твоя задача: разбить следующий запрос на конкретные подзадачи для других AI.

Запрос: "${message}"

Доступные AI для делегирования (${workers.length}):
${workers.map((w, i) => `${i + 1}. ${w.config.name} (${w.config.model})`).join('\n')}

Создай план работы в формате:
1. [Название AI]: Конкретная подзадача
2. [Название AI]: Конкретная подзадача
...

Будь конкретным в формулировке задач. Каждая задача должна быть независимой.`;

    const planResponse = await this.sendToChat(orchestrator, planningPrompt, maxTokens, getApiUrl);
    onStepUpdate?.('plan_created', { plan: planResponse.content });

    // Шаг 2: Извлекаем задачи из плана (простой парсинг)
    const tasks = this.extractTasks(planResponse.content, workers);
    onStepUpdate?.('tasks_assigned', { tasks });

    // Шаг 3: Отправляем задачи исполнителям параллельно
    onStepUpdate?.('executing', { count: tasks.length });

    const taskResults = await Promise.all(
      tasks.map(async (task) => {
        const result = await this.sendToChat(task.chat, task.task, maxTokens, getApiUrl);
        return {
          chatName: task.chat.config.name,
          task: task.task,
          result: result.content
        };
      })
    );

    onStepUpdate?.('tasks_completed', { results: taskResults });

    // Шаг 4: Оркестратор собирает результаты и формирует финальный ответ
    onStepUpdate?.('finalizing', { orchestrator: orchestrator.config.name });

    const resultsContext = taskResults
      .map(r => `**${r.chatName}** (задача: ${r.task}):\n${r.result}`)
      .join('\n\n---\n\n');

    const finalPrompt = `Исходный запрос: "${message}"

Результаты работы команды:

${resultsContext}

Твоя задача: проанализировать все результаты и создать единый, структурированный ответ на исходный запрос. Объедини лучшие идеи, устрани противоречия, добавь свои выводы.`;

    const finalResponse = await this.sendToChat(orchestrator, finalPrompt, maxTokens, getApiUrl);

    // Возвращаем все ответы: от исполнителей + финальный от оркестратора
    return [
      ...taskResults.map(r => ({
        chatId: tasks.find(t => t.chat.config.name === r.chatName)?.chat.id || '',
        chatName: r.chatName,
        content: `📋 Задача: ${r.task}\n\n${r.result}`,
        timestamp: Date.now()
      })),
      {
        chatId: orchestrator.id,
        chatName: `👑 ${orchestrator.config.name} (Координатор)`,
        content: finalResponse.content,
        timestamp: Date.now()
      }
    ];
  }

  /**
   * Отправка сообщения одному чату
   */
  private static async sendToChat(
    chat: Chat,
    message: string,
    maxTokens: number,
    getApiUrl: (config: ChatConfig) => string
  ): Promise<AgentResponse> {
    try {
      const apiMessages = [
        ...chat.messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: message }
      ];

      const response = await fetch(getApiUrl(chat.config), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${chat.config.apiKey}`
        },
        body: JSON.stringify({
          model: chat.config.model,
          messages: apiMessages,
          temperature: chat.config.temperature || 0.7,
          max_tokens: maxTokens,
          stream: false
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || data.content?.[0]?.text || 'No response';

        return {
          chatId: chat.id,
          chatName: chat.config.name,
          content,
          timestamp: Date.now()
        };
      }
    } catch (error) {
      console.error(`Error sending to ${chat.config.name}:`, error);
    }

    return {
      chatId: chat.id,
      chatName: chat.config.name,
      content: '❌ Ошибка получения ответа',
      timestamp: Date.now()
    };
  }

  /**
   * Извлечение задач из плана оркестратора
   */
  private static extractTasks(plan: string, workers: Chat[]): Array<{ chat: Chat; task: string }> {
    const tasks: Array<{ chat: Chat; task: string }> = [];
    const lines = plan.split('\n');

    for (const line of lines) {
      // Ищем строки вида "1. [Название]: Задача" или "- [Название]: Задача"
      const match = line.match(/^[\d\-\*\.]+\s*\[?([^\]]+)\]?:\s*(.+)$/);
      if (match) {
        const aiName = match[1].trim();
        const task = match[2].trim();

        // Находим соответствующий чат
        const chat = workers.find(w =>
          w.config.name.toLowerCase().includes(aiName.toLowerCase()) ||
          aiName.toLowerCase().includes(w.config.name.toLowerCase())
        );

        if (chat && task) {
          tasks.push({ chat, task });
        }
      }
    }

    // Если не удалось распарсить, распределяем задачи равномерно
    if (tasks.length === 0 && workers.length > 0) {
      const genericTask = `Помоги с этим запросом, сосредоточься на своей области экспертизы: ${plan}`;
      workers.forEach(worker => {
        tasks.push({ chat: worker, task: genericTask });
      });
    }

    return tasks;
  }
}
