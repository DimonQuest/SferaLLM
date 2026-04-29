import React, { useState } from 'react';
import './MarkdownRenderer.css';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const parseMarkdown = (text: string): JSX.Element[] => {
    const elements: JSX.Element[] = [];
    let key = 0;

    // Разбиваем на блоки кода и обычный текст
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Добавляем текст до блока кода
      if (match.index > lastIndex) {
        const beforeText = text.slice(lastIndex, match.index);
        elements.push(...parseInlineMarkdown(beforeText, key));
        key++;
      }

      // Добавляем блок кода
      const language = match[1] || 'text';
      const code = match[2];
      const codeId = `code-${key}`;

      elements.push(
        <div key={key} className="code-block">
          <div className="code-header">
            <span className="code-language">{language}</span>
            <button
              className="code-copy-btn"
              onClick={() => copyToClipboard(code, codeId)}
            >
              {copiedCode === codeId ? '✓ Скопировано' : '📋 Копировать'}
            </button>
          </div>
          <pre>
            <code className={`language-${language}`}>
              {highlightCode(code, language)}
            </code>
          </pre>
        </div>
      );
      key++;

      lastIndex = match.index + match[0].length;
    }

    // Добавляем оставшийся текст
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex);
      elements.push(...parseInlineMarkdown(remainingText, key));
    }

    return elements;
  };

  const parseInlineMarkdown = (text: string, startKey: number): JSX.Element[] => {
    const elements: JSX.Element[] = [];
    const lines = text.split('\n');

    lines.forEach((line, index) => {
      const key = startKey + index;

      // Заголовки
      if (line.startsWith('### ')) {
        elements.push(<h3 key={key}>{parseInlineFormatting(line.slice(4))}</h3>);
      } else if (line.startsWith('## ')) {
        elements.push(<h2 key={key}>{parseInlineFormatting(line.slice(3))}</h2>);
      } else if (line.startsWith('# ')) {
        elements.push(<h1 key={key}>{parseInlineFormatting(line.slice(2))}</h1>);
      }
      // Списки
      else if (line.match(/^\d+\.\s/)) {
        elements.push(<li key={key}>{parseInlineFormatting(line.replace(/^\d+\.\s/, ''))}</li>);
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        elements.push(<li key={key}>{parseInlineFormatting(line.slice(2))}</li>);
      }
      // Цитаты
      else if (line.startsWith('> ')) {
        elements.push(<blockquote key={key}>{parseInlineFormatting(line.slice(2))}</blockquote>);
      }
      // Горизонтальная линия
      else if (line.match(/^---+$/)) {
        elements.push(<hr key={key} />);
      }
      // Inline код
      else if (line.includes('`')) {
        elements.push(<p key={key}>{parseInlineCode(line)}</p>);
      }
      // Обычный текст
      else if (line.trim()) {
        elements.push(<p key={key}>{parseInlineFormatting(line)}</p>);
      } else {
        elements.push(<br key={key} />);
      }
    });

    return elements;
  };

  const parseInlineFormatting = (text: string): (string | JSX.Element)[] => {
    const parts: (string | JSX.Element)[] = [];
    let remaining = text;
    let key = 0;

    // Жирный текст **text**
    const boldRegex = /\*\*(.*?)\*\*/g;
    // Курсив *text*
    const italicRegex = /\*(.*?)\*/g;
    // Ссылки [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

    // Простая обработка (можно улучшить для вложенных форматов)
    remaining = remaining.replace(boldRegex, (_, content) => {
      return `<strong>${content}</strong>`;
    });

    remaining = remaining.replace(italicRegex, (_, content) => {
      return `<em>${content}</em>`;
    });

    remaining = remaining.replace(linkRegex, (_, text, url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    });

    // Возвращаем как HTML
    return [<span key={key} dangerouslySetInnerHTML={{ __html: remaining }} />];
  };

  const parseInlineCode = (text: string): (string | JSX.Element)[] => {
    const parts: (string | JSX.Element)[] = [];
    const regex = /`([^`]+)`/g;
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      parts.push(<code key={key++} className="inline-code">{match[1]}</code>);
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

  const highlightCode = (code: string, language: string): (string | JSX.Element)[] => {
    // Простая подсветка синтаксиса (можно заменить на библиотеку)
    const keywords: Record<string, string[]> = {
      javascript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'async', 'await'],
      typescript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'async', 'await', 'interface', 'type'],
      python: ['def', 'class', 'return', 'if', 'else', 'elif', 'for', 'while', 'import', 'from', 'as', 'try', 'except', 'with'],
      java: ['public', 'private', 'class', 'void', 'return', 'if', 'else', 'for', 'while', 'new', 'import', 'package'],
      go: ['func', 'var', 'const', 'return', 'if', 'else', 'for', 'range', 'import', 'package', 'type', 'struct']
    };

    const langKeywords = keywords[language.toLowerCase()] || [];
    const lines = code.split('\n');

    return lines.map((line, index) => {
      let highlighted = line;

      // Подсветка ключевых слов
      langKeywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g');
        highlighted = highlighted.replace(regex, `<span class="keyword">${keyword}</span>`);
      });

      // Подсветка строк
      highlighted = highlighted.replace(/(["'`])(.*?)\1/g, '<span class="string">$1$2$1</span>');

      // Подсветка комментариев
      highlighted = highlighted.replace(/(\/\/.*$|#.*$)/g, '<span class="comment">$1</span>');

      return (
        <React.Fragment key={index}>
          <span dangerouslySetInnerHTML={{ __html: highlighted }} />
          {index < lines.length - 1 && '\n'}
        </React.Fragment>
      );
    });
  };

  return <div className="markdown-content">{parseMarkdown(content)}</div>;
};

export default MarkdownRenderer;
