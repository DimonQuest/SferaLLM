import React from 'react';
import './MessageContent.css';

interface MessageContentProps {
  content: string;
}

const MessageContent: React.FC<MessageContentProps> = ({ content }) => {
  const parseContent = (text: string) => {
    const parts: JSX.Element[] = [];
    let lastIndex = 0;

    // Регулярное выражение для поиска блоков кода
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const inlineCodeRegex = /`([^`]+)`/g;

    let match;

    // Обработка блоков кода
    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Добавляем текст до блока кода
      if (match.index > lastIndex) {
        const beforeText = text.substring(lastIndex, match.index);
        parts.push(
          <span key={`text-${lastIndex}`} dangerouslySetInnerHTML={{ __html: processInlineCode(beforeText) }} />
        );
      }

      const language = match[1] || 'text';
      const code = match[2];

      parts.push(
        <div key={`code-${match.index}`} className="code-block">
          <div className="code-header">
            <span className="code-language">{language}</span>
            <button
              className="code-copy-btn"
              onClick={() => {
                navigator.clipboard.writeText(code);
              }}
              title="Копировать код"
            >
              📋 Копировать
            </button>
          </div>
          <pre>
            <code className={`language-${language}`}>{code}</code>
          </pre>
        </div>
      );

      lastIndex = match.index + match[0].length;
    }

    // Добавляем оставшийся текст
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex);
      parts.push(
        <span key={`text-${lastIndex}`} dangerouslySetInnerHTML={{ __html: processInlineCode(remainingText) }} />
      );
    }

    return parts.length > 0 ? parts : <span>{text}</span>;
  };

  const processInlineCode = (text: string): string => {
    return text.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
  };

  return <div className="message-content-parsed">{parseContent(content)}</div>;
};

export default MessageContent;
