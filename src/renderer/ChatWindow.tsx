import React, { useState, useRef, useEffect } from 'react';
import { Chat, Message } from '../types';
import { parseApiError, logError } from '../utils/errorHandler';
import { getMaxTokensForLength } from '../types/settings';
import { getSettings } from './Settings';
import MessageContent from './MessageContent';
import VoiceInput from './VoiceInput';
import { ToolHandler } from '../utils/toolHandler';
import { fetchWithProxy } from '../utils/proxyFetch';
import './ChatWindow.css';

interface ChatWindowProps {
  chat: Chat;
  isActive: boolean;
  onUpdateMessages: (messages: Message[]) => void;
  onFocus?: () => void;
  onToggleEnabled?: () => void;
  onToggleMaximize?: () => void;
  onClearChat?: () => void;
  onChangeResponseLength?: (length: 'short' | 'standard' | 'detailed') => void;
  onToggleBookmark?: (messageId: string) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ chat, isActive, onUpdateMessages, onFocus, onToggleEnabled, onToggleMaximize, onClearChat, onChangeResponseLength, onToggleBookmark }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  // Закрываем меню при клике вне его
  useEffect(() => {
    const handleClickOutside = () => {
      if (menuOpen) setMenuOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuOpen]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachedFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(attachedFiles.filter((_, i) => i !== index));
  };

  const supportsFiles = (): boolean => {
    const provider = chat.config.provider;
    const model = chat.config.model.toLowerCase();

    // OpenAI - только vision модели
    if (provider === 'openai') {
      return model.includes('gpt-4o') ||
             model.includes('gpt-4-vision') ||
             model.includes('gpt-4-turbo') ||
             model.includes('vision');
    }

    // Anthropic - Claude 3+ поддерживает файлы
    if (provider === 'anthropic') {
      return model.includes('claude-3') ||
             model.includes('claude-4') ||
             model.includes('opus') ||
             model.includes('sonnet') ||
             model.includes('haiku');
    }

    // Google - Gemini Pro Vision
    if (provider === 'google') {
      return model.includes('gemini') && model.includes('vision');
    }

    // Custom - предполагаем что поддерживает
    if (provider === 'custom') {
      return true;
    }

    // Mistral и остальные - не поддерживают
    return false;
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Для текстовых файлов возвращаем текст, для остальных base64
        resolve(result);
      };
      reader.onerror = reject;

      // Для текстовых файлов читаем как текст
      if (file.type.startsWith('text/') ||
          file.name.endsWith('.txt') ||
          file.name.endsWith('.md') ||
          file.name.endsWith('.json') ||
          file.name.endsWith('.xml') ||
          file.name.endsWith('.csv') ||
          file.name.endsWith('.log')) {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    });
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setLoading(false);
      setStreaming(false);
    }
  };

  const handleVoiceTranscript = (text: string) => {
    setInput(prev => prev + (prev ? ' ' : '') + text);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading || !chat.enabled) return;

    const settings = getSettings();
    const maxTokens = chat.responseLength
      ? getMaxTokensForLength(chat.responseLength)
      : getMaxTokensForLength(settings.responseLength);

    let messageContent: any = input;
    let fileDescriptions: string[] = [];

    if (attachedFiles.length > 0) {
      const fileContents = await Promise.all(
        attachedFiles.map(async (file) => {
          const content = await fileToBase64(file);
          const isImage = file.type.startsWith('image/');
          const isText = file.type.startsWith('text/') ||
                        file.name.match(/\.(txt|md|json|xml|csv|log|js|ts|py|java|cpp|c|h|css|html)$/i);

          fileDescriptions.push(`${file.name} (${(file.size / 1024).toFixed(2)} KB)`);

          if (isImage) {
            return {
              type: 'image_url',
              image_url: { url: content }
            };
          } else if (isText) {
            return {
              type: 'text',
              text: `\n\n--- Файл: ${file.name} ---\n${content}\n--- Конец файла ---\n`
            };
          } else {
            return {
              type: 'text',
              text: `\n\n--- Файл: ${file.name} (${file.type || 'binary'}) ---\nBase64: ${content}\n--- Конец файла ---\n`
            };
          }
        })
      );

      messageContent = [
        { type: 'text', text: input },
        ...fileContents
      ];
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: typeof messageContent === 'string' ? messageContent : `${input}\n📎 Прикреплено: ${fileDescriptions.join(', ')}`,
      timestamp: Date.now()
    };

    const newMessages = [...chat.messages, userMessage];
    onUpdateMessages(newMessages);
    setInput('');
    setAttachedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setLoading(true);

    const assistantMessageId = (Date.now() + 1).toString();
    let accumulatedContent = '';

    try {
      const apiMessages = newMessages.map(m => ({
        role: m.role,
        content: m.id === userMessage.id ? messageContent : m.content
      }));

      if (chat.config.systemPrompt && chat.config.systemPrompt.trim()) {
        apiMessages.unshift({
          role: 'system',
          content: chat.config.systemPrompt
        });
      }

      abortControllerRef.current = new AbortController();

      // Добавляем инструменты AI только для поддерживаемых провайдеров
      const supportsTools = ['openai', 'anthropic', 'openrouter', 'omniroute', '9route'].includes(chat.config.provider);
      const requestBody: any = {
        model: chat.config.model,
        messages: apiMessages,
        temperature: chat.config.temperature || 0.7,
        max_tokens: maxTokens,
        stream: true
      };

      if (supportsTools) {
        requestBody.tools = ToolHandler.getAvailableTools();
        requestBody.tool_choice = 'auto';
      }

      const response = await fetchWithProxy(getDefaultUrl(chat.config.provider), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${chat.config.apiKey}`
        },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal
      }, chat.config);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      setStreaming(true);
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No reader available');

      let toolCalls: any[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content ||
                            parsed.delta?.text ||
                            parsed.text || '';

              // Проверяем наличие tool_calls
              const deltaToolCalls = parsed.choices?.[0]?.delta?.tool_calls;
              if (deltaToolCalls) {
                for (const tc of deltaToolCalls) {
                  if (tc.index !== undefined) {
                    if (!toolCalls[tc.index]) {
                      toolCalls[tc.index] = {
                        id: tc.id || '',
                        type: tc.type || 'function',
                        function: { name: '', arguments: '' }
                      };
                    }
                    if (tc.function?.name) {
                      toolCalls[tc.index].function.name += tc.function.name;
                    }
                    if (tc.function?.arguments) {
                      toolCalls[tc.index].function.arguments += tc.function.arguments;
                    }
                  }
                }
              }

              if (content) {
                accumulatedContent += content;
                const streamMessage: Message = {
                  id: assistantMessageId,
                  role: 'assistant',
                  content: accumulatedContent,
                  timestamp: Date.now()
                };
                onUpdateMessages([...newMessages, streamMessage]);
              }
            } catch (e) {
              console.error('Parse error:', e);
            }
          }
        }
      }

      // Если есть tool_calls, выполняем их
      if (toolCalls.length > 0) {
        const toolMessage: Message = {
          id: assistantMessageId,
          role: 'assistant',
          content: accumulatedContent + '\n\n🔧 Выполняю инструменты...',
          timestamp: Date.now()
        };
        onUpdateMessages([...newMessages, toolMessage]);

        for (const toolCall of toolCalls) {
          try {
            const params = JSON.parse(toolCall.function.arguments);
            const result = await ToolHandler.executeTool({
              tool: toolCall.function.name,
              parameters: params,
              chatId: chat.id
            });

            const formatted = ToolHandler.formatToolResult(toolCall.function.name, result);
            accumulatedContent += '\n\n' + formatted;

            const updatedMessage: Message = {
              id: assistantMessageId,
              role: 'assistant',
              content: accumulatedContent,
              timestamp: Date.now()
            };
            onUpdateMessages([...newMessages, updatedMessage]);
          } catch (error: any) {
            console.error('Tool execution error:', error);
            accumulatedContent += `\n\n❌ Ошибка выполнения инструмента: ${error.message}`;
            const errorMessage: Message = {
              id: assistantMessageId,
              role: 'assistant',
              content: accumulatedContent,
              timestamp: Date.now()
            };
            onUpdateMessages([...newMessages, errorMessage]);
          }
        }
      }

      setStreaming(false);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        const stoppedMessage: Message = {
          id: assistantMessageId,
          role: 'assistant',
          content: accumulatedContent + '\n\n⏹️ Генерация остановлена',
          timestamp: Date.now()
        };
        onUpdateMessages([...newMessages, stoppedMessage]);
      } else {
        logError('ChatWindow.sendMessage', error, {
          provider: chat.config.provider,
          model: chat.config.model
        });

        const errorInfo = parseApiError(error, chat.config.provider);
        const errorMessage: Message = {
          id: assistantMessageId,
          role: 'assistant',
          content: `❌ ${errorInfo.title}\n\n${errorInfo.message}${errorInfo.suggestion ? `\n\n💡 ${errorInfo.suggestion}` : ''}`,
          timestamp: Date.now()
        };
        onUpdateMessages([...newMessages, errorMessage]);
      }
    } finally {
      setLoading(false);
      setStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const getDefaultUrl = (provider: string) => {
    const urls: Record<string, string> = {
      openai: 'https://api.openai.com/v1/chat/completions',
      anthropic: 'https://api.anthropic.com/v1/messages',
      google: 'https://generativelanguage.googleapis.com/v1/models',
      mistral: 'https://api.mistral.ai/v1/chat/completions',
      openrouter: 'https://openrouter.ai/api/v1/chat/completions',
      cohere: 'https://api.cohere.ai/v1/chat',
      perplexity: 'https://api.perplexity.ai/chat/completions',
      groq: 'https://api.groq.com/openai/v1/chat/completions',
      xai: 'https://api.x.ai/v1/chat/completions',
      deepseek: 'https://api.deepseek.com/v1/chat/completions'
    };

    // For OmniRoute and 9route, use baseUrl from config
    if (provider === 'omniroute' || provider === '9route') {
      if (chat.config.baseUrl) {
        const base = chat.config.baseUrl.replace(/\/+$/, '');
        return base.endsWith('/chat/completions') ? base : base + '/chat/completions';
      }
      // Fallback if no baseUrl provided
      return 'http://localhost:20129/chat/completions';
    }

    // For custom provider with baseUrl
    if (provider === 'custom' && chat.config.baseUrl) {
      const base = chat.config.baseUrl.replace(/\/+$/, '');
      if (!base.endsWith('/chat/completions')) {
        return base + '/v1/chat/completions';
      }
      return base;
    }

    return urls[provider] || '';
  };

  const regenerateMessage = async (messageId: string) => {
    if (loading) return;

    const messageIndex = chat.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1 || messageIndex === 0) return;

    const currentMessage = chat.messages[messageIndex];
    const messagesUpToUser = chat.messages.slice(0, messageIndex);

    setLoading(true);
    const assistantMessageId = messageId;
    let accumulatedContent = '';

    try {
      const settings = getSettings();
      const maxTokens = chat.responseLength
        ? getMaxTokensForLength(chat.responseLength)
        : getMaxTokensForLength(settings.responseLength);

      const apiMessages = messagesUpToUser.map(m => ({
        role: m.role,
        content: m.content
      }));

      if (chat.config.systemPrompt && chat.config.systemPrompt.trim()) {
        apiMessages.unshift({
          role: 'system',
          content: chat.config.systemPrompt
        });
      }

      abortControllerRef.current = new AbortController();

      // Добавляем инструменты AI только для поддерживаемых провайдеров
      const supportsTools = ['openai', 'anthropic', 'openrouter', 'omniroute', '9route'].includes(chat.config.provider);
      const requestBody: any = {
        model: chat.config.model,
        messages: apiMessages,
        temperature: chat.config.temperature || 0.7,
        max_tokens: maxTokens,
        stream: true
      };

      if (supportsTools) {
        requestBody.tools = ToolHandler.getAvailableTools();
        requestBody.tool_choice = 'auto';
      }

      const response = await fetchWithProxy(getDefaultUrl(chat.config.provider), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${chat.config.apiKey}`
        },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal
      }, chat.config);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      setStreaming(true);
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No reader available');

      let toolCalls: any[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content ||
                            parsed.delta?.text ||
                            parsed.text || '';

              // Проверяем наличие tool_calls
              const deltaToolCalls = parsed.choices?.[0]?.delta?.tool_calls;
              if (deltaToolCalls) {
                for (const tc of deltaToolCalls) {
                  if (tc.index !== undefined) {
                    if (!toolCalls[tc.index]) {
                      toolCalls[tc.index] = {
                        id: tc.id || '',
                        type: tc.type || 'function',
                        function: { name: '', arguments: '' }
                      };
                    }
                    if (tc.function?.name) {
                      toolCalls[tc.index].function.name += tc.function.name;
                    }
                    if (tc.function?.arguments) {
                      toolCalls[tc.index].function.arguments += tc.function.arguments;
                    }
                  }
                }
              }

              if (content) {
                accumulatedContent += content;

                // Сохраняем старую версию и обновляем текущую
                const updatedMessages = chat.messages.map((m, idx) => {
                  if (idx === messageIndex) {
                    const versions = m.versions || [];
                    const currentVersionIndex = m.currentVersionIndex || 0;

                    // Если это первая регенерация, сохраняем оригинал
                    if (versions.length === 0) {
                      versions.push({
                        id: m.id + '-v0',
                        content: m.content,
                        timestamp: m.timestamp,
                        tokens: m.tokens
                      });
                    }

                    return {
                      ...m,
                      content: accumulatedContent,
                      timestamp: Date.now(),
                      versions,
                      currentVersionIndex: versions.length
                    };
                  }
                  return m;
                });

                onUpdateMessages(updatedMessages);
              }
            } catch (e) {
              console.error('Parse error:', e);
            }
          }
        }
      }

      // Если есть tool_calls, выполняем их
      if (toolCalls.length > 0) {
        for (const toolCall of toolCalls) {
          try {
            const params = JSON.parse(toolCall.function.arguments);
            const result = await ToolHandler.executeTool({
              tool: toolCall.function.name,
              parameters: params,
              chatId: chat.id
            });

            const formatted = ToolHandler.formatToolResult(toolCall.function.name, result);
            accumulatedContent += '\n\n' + formatted;

            const updatedMessages = chat.messages.map((m, idx) => {
              if (idx === messageIndex) {
                return {
                  ...m,
                  content: accumulatedContent,
                  timestamp: Date.now()
                };
              }
              return m;
            });
            onUpdateMessages(updatedMessages);
          } catch (error: any) {
            console.error('Tool execution error:', error);
            accumulatedContent += `\n\n❌ Ошибка выполнения инструмента: ${error.message}`;
            const updatedMessages = chat.messages.map((m, idx) => {
              if (idx === messageIndex) {
                return {
                  ...m,
                  content: accumulatedContent,
                  timestamp: Date.now()
                };
              }
              return m;
            });
            onUpdateMessages(updatedMessages);
          }
        }
      }

      // Финализируем версию
      const finalMessages = chat.messages.map((m, idx) => {
        if (idx === messageIndex) {
          const versions = m.versions || [];
          if (versions.length === 0) {
            versions.push({
              id: m.id + '-v0',
              content: m.content,
              timestamp: m.timestamp,
              tokens: m.tokens
            });
          }

          versions.push({
            id: m.id + '-v' + versions.length,
            content: accumulatedContent,
            timestamp: Date.now(),
            tokens: Math.ceil(accumulatedContent.length / 4)
          });

          return {
            ...m,
            content: accumulatedContent,
            timestamp: Date.now(),
            versions,
            currentVersionIndex: versions.length - 1
          };
        }
        return m;
      });

      onUpdateMessages(finalMessages);
      setStreaming(false);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Regeneration stopped');
      } else {
        logError('ChatWindow.regenerateMessage', error, {
          provider: chat.config.provider,
          model: chat.config.model
        });

        const errorInfo = parseApiError(error, chat.config.provider);
        alert(`Ошибка регенерации: ${errorInfo.message}`);
      }
    } finally {
      setLoading(false);
      setStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const switchVersion = (messageId: string, direction: number) => {
    const updatedMessages = chat.messages.map(m => {
      if (m.id === messageId && m.versions) {
        const currentIndex = m.currentVersionIndex || 0;
        const newIndex = currentIndex + direction;

        if (newIndex < 0 || newIndex > m.versions.length) return m;

        let newContent: string;
        let newTimestamp: number;
        let newTokens: number | undefined;

        if (newIndex === m.versions.length) {
          // Последняя версия (текущая)
          const lastVersion = m.versions[m.versions.length - 1];
          newContent = lastVersion.content;
          newTimestamp = lastVersion.timestamp;
          newTokens = lastVersion.tokens;
        } else {
          // Одна из сохраненных версий
          const version = m.versions[newIndex];
          newContent = version.content;
          newTimestamp = version.timestamp;
          newTokens = version.tokens;
        }

        return {
          ...m,
          content: newContent,
          timestamp: newTimestamp,
          tokens: newTokens,
          currentVersionIndex: newIndex
        };
      }
      return m;
    });

    onUpdateMessages(updatedMessages);
  };

  return (
    <div
      className={`chat-window ${isActive ? 'active' : ''} ${!chat.enabled ? 'disabled' : ''} ${chat.isMaximized ? 'maximized' : ''}`}
      onClick={() => onFocus?.()}
    >
      <div className="chat-header">
        <h3>{chat.config.name} {!chat.enabled && '(Отключен)'}</h3>
        <div className="token-info">
          {chat.tokenLimit ? (
            <span>{chat.tokensUsed.toLocaleString()} / {chat.tokenLimit.toLocaleString()}</span>
          ) : (
            <span>Unlimited</span>
          )}
        </div>
        <button
          className="maximize-btn"
          onClick={(e) => {
            e.stopPropagation();
            onToggleMaximize?.();
          }}
          title={chat.isMaximized ? "Свернуть" : "Развернуть"}
        >
          {chat.isMaximized ? '🗗' : '🗖'}
        </button>
        <button
          className="close-chat-btn"
          onClick={(e) => {
            e.stopPropagation();
            onToggleEnabled?.();
          }}
          title="Отключить чат"
        >
          ×
        </button>
        <button
          className="menu-btn"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          title="Меню"
        >
          ⋮
        </button>
        {menuOpen && (
          <div className="chat-window-menu">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Очистить историю чата "${chat.config.name}"?`)) {
                  onClearChat?.();
                  setMenuOpen(false);
                }
              }}
            >
              🗑️ Очистить чат
            </button>
            <div className="menu-divider"></div>
            <div className="menu-section-title">Длина ответов:</div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onChangeResponseLength?.('short');
                setMenuOpen(false);
              }}
              className={chat.responseLength === 'short' ? 'active' : ''}
            >
              {chat.responseLength === 'short' ? '✓ ' : ''}Короткие (500)
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onChangeResponseLength?.('standard');
                setMenuOpen(false);
              }}
              className={chat.responseLength === 'standard' || !chat.responseLength ? 'active' : ''}
            >
              {chat.responseLength === 'standard' || !chat.responseLength ? '✓ ' : ''}Стандартные (2000)
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onChangeResponseLength?.('detailed');
                setMenuOpen(false);
              }}
              className={chat.responseLength === 'detailed' ? 'active' : ''}
            >
              {chat.responseLength === 'detailed' ? '✓ ' : ''}Развернутые (4000)
            </button>
          </div>
        )}
      </div>
      <div className="messages">
        {chat.messages.map(msg => (
          <div key={msg.id} id={`message-${msg.id}`} className={`message ${msg.role}`}>
            <div className="message-header">
              <span className="message-role">{msg.role === 'user' ? 'Вы' : chat.config.name}</span>
              <span className="message-time">{new Date(msg.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <MessageContent content={msg.content} />
            <div className="message-actions">
              <button className="copy-btn" onClick={() => navigator.clipboard.writeText(msg.content)} title="Копировать">📋</button>
              {onToggleBookmark && (
                <button
                  className={`bookmark-btn ${msg.bookmarked ? 'bookmarked' : ''}`}
                  onClick={() => onToggleBookmark(msg.id)}
                  title={msg.bookmarked ? "Убрать из закладок" : "Добавить в закладки"}
                >
                  {msg.bookmarked ? '⭐' : '☆'}
                </button>
              )}
              {msg.role === 'assistant' && (
                <button
                  className="regenerate-btn"
                  onClick={() => regenerateMessage(msg.id)}
                  disabled={loading}
                  title="Регенерировать ответ"
                >
                  🔄
                </button>
              )}
              {msg.versions && msg.versions.length > 0 && (
                <div className="version-controls">
                  <button
                    onClick={() => switchVersion(msg.id, -1)}
                    disabled={(msg.currentVersionIndex || 0) === 0}
                    title="Предыдущая версия"
                  >
                    ◀
                  </button>
                  <span className="version-indicator">
                    {(msg.currentVersionIndex || 0) + 1} / {(msg.versions?.length || 0) + 1}
                  </span>
                  <button
                    onClick={() => switchVersion(msg.id, 1)}
                    disabled={(msg.currentVersionIndex || 0) >= (msg.versions?.length || 0)}
                    title="Следующая версия"
                  >
                    ▶
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && !streaming && <div className="message assistant loading">Думаю...</div>}
        {streaming && (
          <div className="streaming-indicator">
            <span>Генерация...</span>
            <button className="stop-btn" onClick={stopGeneration} title="Остановить генерацию">⏹️ Остановить</button>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="input-area">
        {attachedFiles.length > 0 && (
          <div className="attached-files">
            {attachedFiles.map((file, index) => (
              <div key={index} className="attached-file">
                <span>{file.name}</span>
                <button onClick={() => removeFile(index)}>×</button>
              </div>
            ))}
          </div>
        )}
        <div className="input-controls">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          {supportsFiles() && (
            <button
              className="attach-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              title="Прикрепить файл"
            >
              📎
            </button>
          )}
          {/* VoiceInput временно отключен из-за проблем с Web Speech API
          <VoiceInput
            onTranscript={handleVoiceTranscript}
            isActive={voiceActive}
            onToggle={() => setVoiceActive(!voiceActive)}
          />
          */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                sendMessage();
              } else if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Введите сообщение... (Enter - отправить, Shift+Enter - новая строка, Ctrl+Enter - отправить)"
            disabled={loading}
            rows={1}
          />
          <button onClick={sendMessage} disabled={loading || !input.trim()}>
            Отправить
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
