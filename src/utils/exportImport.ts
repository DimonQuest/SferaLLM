import { Chat } from '../types';

export const exportChatsToJSON = (chats: Chat[]): string => {
  const exportData = {
    version: '2.0',
    exportDate: new Date().toISOString(),
    chats: chats.map(chat => ({
      ...chat,
      config: {
        ...chat.config,
        apiKey: '***' // Не экспортируем API ключи
      }
    }))
  };
  return JSON.stringify(exportData, null, 2);
};

export const exportChatsToMarkdown = (chats: Chat[]): string => {
  let markdown = `# SferaLLM Export\n\n`;
  markdown += `Экспортировано: ${new Date().toLocaleString('ru-RU')}\n\n`;
  markdown += `---\n\n`;

  chats.forEach(chat => {
    markdown += `## ${chat.config.name}\n\n`;
    markdown += `**Провайдер:** ${chat.config.provider}\n`;
    markdown += `**Модель:** ${chat.config.model}\n`;
    if (chat.config.systemPrompt) {
      markdown += `**Системный промпт:** ${chat.config.systemPrompt}\n`;
    }
    markdown += `**Сообщений:** ${chat.messages.length}\n`;
    markdown += `**Токенов использовано:** ${chat.tokensUsed}\n\n`;

    if (chat.messages.length > 0) {
      markdown += `### История чата\n\n`;
      chat.messages.forEach(msg => {
        const time = new Date(msg.timestamp).toLocaleString('ru-RU');
        markdown += `**${msg.role === 'user' ? 'Пользователь' : chat.config.name}** (${time}):\n`;
        markdown += `${msg.content}\n\n`;
      });
    }

    markdown += `---\n\n`;
  });

  return markdown;
};

export const importChatsFromJSON = (jsonString: string): Chat[] => {
  try {
    const data = JSON.parse(jsonString);

    if (!data.chats || !Array.isArray(data.chats)) {
      throw new Error('Неверный формат файла');
    }

    return data.chats.map((chat: any) => ({
      ...chat,
      id: Date.now().toString() + Math.random(), // Новый ID для избежания конфликтов
      config: {
        ...chat.config,
        apiKey: '' // API ключи нужно ввести заново
      }
    }));
  } catch (error) {
    throw new Error('Ошибка при импорте: ' + (error as Error).message);
  }
};

export const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const readFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
};
