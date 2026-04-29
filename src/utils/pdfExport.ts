import { Chat } from '../types';

export const exportToPDF = async (chats: Chat[]): Promise<void> => {
  // Создаем HTML контент для PDF
  const htmlContent = generateHTMLForPDF(chats);

  // Открываем окно печати
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Не удалось открыть окно печати. Проверьте настройки блокировки всплывающих окон.');
    return;
  }

  printWindow.document.write(htmlContent);
  printWindow.document.close();

  // Ждем загрузки контента
  printWindow.onload = () => {
    printWindow.print();
  };
};

const generateHTMLForPDF = (chats: Chat[]): string => {
  const styles = `
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        color: #1f2937;
        padding: 40px;
        background: white;
      }

      h1 {
        font-size: 28px;
        margin-bottom: 10px;
        color: #111827;
        border-bottom: 3px solid #3b82f6;
        padding-bottom: 10px;
      }

      .export-date {
        color: #6b7280;
        font-size: 14px;
        margin-bottom: 30px;
      }

      .chat-section {
        margin-bottom: 40px;
        page-break-inside: avoid;
      }

      .chat-header {
        background: #f3f4f6;
        padding: 15px;
        border-radius: 8px;
        margin-bottom: 20px;
        border-left: 4px solid #3b82f6;
      }

      .chat-title {
        font-size: 20px;
        font-weight: 600;
        color: #111827;
        margin-bottom: 8px;
      }

      .chat-meta {
        font-size: 13px;
        color: #6b7280;
        display: flex;
        gap: 20px;
        flex-wrap: wrap;
      }

      .message {
        margin-bottom: 20px;
        padding: 15px;
        border-radius: 8px;
        page-break-inside: avoid;
      }

      .message.user {
        background: #eff6ff;
        border-left: 3px solid #3b82f6;
      }

      .message.assistant {
        background: #f9fafb;
        border-left: 3px solid #10b981;
      }

      .message-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-size: 12px;
        color: #6b7280;
      }

      .message-role {
        font-weight: 600;
        text-transform: uppercase;
      }

      .message-content {
        color: #1f2937;
        white-space: pre-wrap;
        word-wrap: break-word;
      }

      .code-block {
        background: #1f2937;
        color: #f3f4f6;
        padding: 15px;
        border-radius: 6px;
        margin: 10px 0;
        overflow-x: auto;
        font-family: 'Courier New', monospace;
        font-size: 13px;
      }

      .code-header {
        color: #9ca3af;
        font-size: 11px;
        margin-bottom: 8px;
        text-transform: uppercase;
      }

      .inline-code {
        background: #e5e7eb;
        padding: 2px 6px;
        border-radius: 3px;
        font-family: 'Courier New', monospace;
        font-size: 13px;
        color: #dc2626;
      }

      @media print {
        body {
          padding: 20px;
        }

        .chat-section {
          page-break-after: always;
        }

        .chat-section:last-child {
          page-break-after: auto;
        }
      }
    </style>
  `;

  const chatSections = chats.map(chat => {
    const messagesHTML = chat.messages.map(msg => {
      const formattedContent = formatMessageContent(msg.content);
      const timestamp = new Date(msg.timestamp).toLocaleString('ru-RU');

      return `
        <div class="message ${msg.role}">
          <div class="message-header">
            <span class="message-role">${msg.role === 'user' ? 'Пользователь' : chat.config.name}</span>
            <span class="message-time">${timestamp}</span>
          </div>
          <div class="message-content">${formattedContent}</div>
        </div>
      `;
    }).join('');

    return `
      <div class="chat-section">
        <div class="chat-header">
          <div class="chat-title">${chat.config.name}</div>
          <div class="chat-meta">
            <span>Провайдер: ${chat.config.provider}</span>
            <span>Модель: ${chat.config.model}</span>
            <span>Сообщений: ${chat.messages.length}</span>
            <span>Токенов: ${chat.tokensUsed.toLocaleString()}</span>
          </div>
        </div>
        ${messagesHTML}
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Экспорт чатов - SferaLLM</title>
      ${styles}
    </head>
    <body>
      <h1>Экспорт чатов - SferaLLM</h1>
      <div class="export-date">Дата экспорта: ${new Date().toLocaleString('ru-RU')}</div>
      ${chatSections}
    </body>
    </html>
  `;
};

const formatMessageContent = (content: string): string => {
  // Обработка блоков кода
  let formatted = content.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    return `<div class="code-block"><div class="code-header">${lang || 'code'}</div><pre>${escapeHtml(code)}</pre></div>`;
  });

  // Обработка inline кода
  formatted = formatted.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  // Обработка переносов строк
  formatted = formatted.replace(/\n/g, '<br>');

  return formatted;
};

const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

export const exportToHTML = (chats: Chat[]): void => {
  const htmlContent = generateHTMLForPDF(chats);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `chats-export-${new Date().toISOString().split('T')[0]}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
