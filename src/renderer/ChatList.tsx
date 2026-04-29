import React, { useState } from 'react';
import { Chat, ChatConfig } from '../types';
import { validateChatConfig } from '../utils/validation';
import { getCountryList } from '../utils/proxyManager';
import './ChatList.css';

interface ChatListProps {
  chats: Chat[];
  activeChat: string | null;
  onSelectChat: (chatId: string) => void;
  onCreateChat: (config: ChatConfig) => void;
  onDeleteChat: (chatId: string) => void;
  onUpdateChat: (chatId: string, config: ChatConfig) => void;
  onToggleEnabled: (chatId: string) => void;
  onClearChat: (chatId: string) => void;
  onReorderChats?: (chats: Chat[]) => void;
  layout: 'horizontal' | 'vertical' | 'grid' | 'custom';
  onLayoutChange: (layout: 'horizontal' | 'vertical' | 'grid' | 'custom') => void;
}

const getProviderIcon = (provider: string): string => {
  const icons: Record<string, string> = {
    openai: '🤖',
    anthropic: '🧠',
    google: '🔍',
    mistral: '🌪️',
    openrouter: '🔀',
    omniroute: '🌐',
    cohere: '🔷',
    perplexity: '🔮',
    groq: '⚡',
    xai: '✖️',
    deepseek: '🌊',
    '9route': '9️⃣',
    custom: '⚙️'
  };
  return icons[provider] || '💬';
};

const getProviderColor = (provider: string): string => {
  const colors: Record<string, string> = {
    openai: '#10a37f',
    anthropic: '#d97757',
    google: '#4285f4',
    mistral: '#ff7000',
    openrouter: '#8b5cf6',
    omniroute: '#06b6d4',
    cohere: '#39c5bb',
    perplexity: '#6366f1',
    groq: '#f97316',
    xai: '#000000',
    deepseek: '#0ea5e9',
    '9route': '#10b981',
    custom: '#64748b'
  };
  return colors[provider] || '#3b82f6';
};

const ChatList: React.FC<ChatListProps> = ({
  chats,
  activeChat,
  onSelectChat,
  onCreateChat,
  onDeleteChat,
  onUpdateChat,
  onToggleEnabled,
  onClearChat,
  onReorderChats,
  layout,
  onLayoutChange
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [newChatConfig, setNewChatConfig] = useState<Partial<ChatConfig>>({
    name: '',
    provider: 'openai',
    model: 'gpt-4',
    apiKey: '',
    temperature: 0.7,
    maxTokens: 2000,
    systemPrompt: '',
    proxyMode: 'none',
    proxyCountry: 'Любая',
    proxyHost: '',
    proxyPort: undefined,
    proxyUsername: '',
    proxyPassword: ''
  });

  const handleCreateChat = () => {
    const validation = validateChatConfig(newChatConfig);

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    setValidationErrors([]);

    if (editingChatId) {
      onUpdateChat(editingChatId, { ...newChatConfig, id: editingChatId } as ChatConfig);
      setEditingChatId(null);
    } else {
      onCreateChat(newChatConfig as ChatConfig);
    }
    setShowModal(false);
    setNewChatConfig({
      name: '',
      provider: 'openai',
      model: 'gpt-4',
      apiKey: '',
      temperature: 0.7,
      maxTokens: 2000,
      systemPrompt: '',
      proxyMode: 'none',
      proxyCountry: 'Любая',
      proxyHost: '',
      proxyPort: undefined,
      proxyUsername: '',
      proxyPassword: ''
    });
  };

  const handleEditChat = (chat: Chat) => {
    setEditingChatId(chat.id);
    setNewChatConfig(chat.config);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingChatId(null);
    setValidationErrors([]);
    setNewChatConfig({
      name: '',
      provider: 'openai',
      model: 'gpt-4',
      apiKey: '',
      temperature: 0.7,
      maxTokens: 2000,
      systemPrompt: '',
      proxyMode: 'none',
      proxyCountry: 'Любая',
      proxyHost: '',
      proxyPort: undefined,
      proxyUsername: '',
      proxyPassword: ''
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newChats = [...chats];
    const draggedChat = newChats[draggedIndex];
    newChats.splice(draggedIndex, 1);
    newChats.splice(index, 0, draggedChat);

    onReorderChats?.(newChats);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="chat-list">
      <div className="chat-list-header">
        <h2>Чаты</h2>
        <button onClick={() => setShowModal(true)}>+ Новый чат</button>
      </div>
      <div className="chats">
        {chats.map((chat, index) => (
          <div
            key={chat.id}
            className={`chat-item ${activeChat === chat.id ? 'active' : ''} ${!chat.enabled ? 'disabled' : ''} ${draggedIndex === index ? 'dragging' : ''}`}
            onClick={() => onSelectChat(chat.id)}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            style={{ '--provider-color': getProviderColor(chat.config.provider) } as React.CSSProperties}
          >
            <div className="chat-item-header">
              <div className="chat-info-tooltip">
                <span
                  className="tooltip-icon"
                  title={`Провайдер: ${chat.config.provider}\nМодель: ${chat.config.model}${chat.config.baseUrl ? `\nURL: ${chat.config.baseUrl}` : ''}`}
                >
                  ?
                </span>
              </div>
            </div>
            <div className="provider-icon">{getProviderIcon(chat.config.provider)}</div>
            <div className="chat-item-info">
              <span className="chat-name">{chat.config.name}</span>
            </div>
            <div className="chat-item-actions">
              <button
                className="toggle-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleEnabled(chat.id);
                }}
                title={chat.enabled ? 'Отключить' : 'Включить'}
              >
                {chat.enabled ? '👁️' : '👁️‍🗨️'}
              </button>
              <button
                className="edit-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditChat(chat);
                }}
              >
                ✎
              </button>
              <button
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChat(chat.id);
                }}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onMouseDown={(e) => {
          if (e.target === e.currentTarget) handleCloseModal();
        }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} onContextMenu={(e) => e.stopPropagation()}>
            <h3>{editingChatId ? 'Редактировать чат' : 'Создать новый чат'}</h3>

            <div className="modal-content">
            {validationErrors.length > 0 && (
              <div className="validation-errors">
                {validationErrors.map((error, index) => (
                  <div key={index} className="error-message">⚠️ {error}</div>
                ))}
              </div>
            )}

            <input
              type="text"
              placeholder="Название чата"
              value={newChatConfig.name}
              onChange={(e) => setNewChatConfig({ ...newChatConfig, name: e.target.value })}
            />
            <select
              value={newChatConfig.provider}
              onChange={(e) => setNewChatConfig({ ...newChatConfig, provider: e.target.value as any })}
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="google">Google</option>
              <option value="mistral">Mistral</option>
              <option value="cohere">Cohere</option>
              <option value="perplexity">Perplexity</option>
              <option value="groq">Groq</option>
              <option value="xai">xAI (Grok)</option>
              <option value="deepseek">DeepSeek</option>
              <option value="openrouter">OpenRouter</option>
              <option value="omniroute">OmniRoute</option>
              <option value="9route">9route</option>
              <option value="custom">Custom</option>
            </select>
            <input
              type="text"
              placeholder="Модель (например, gpt-4)"
              value={newChatConfig.model}
              onChange={(e) => setNewChatConfig({ ...newChatConfig, model: e.target.value })}
            />
            <input
              type="password"
              placeholder="API ключ"
              value={newChatConfig.apiKey}
              onChange={(e) => setNewChatConfig({ ...newChatConfig, apiKey: e.target.value })}
            />
            {(newChatConfig.provider === 'custom' || newChatConfig.provider === 'omniroute' || newChatConfig.provider === '9route') && (
              <input
                type="text"
                placeholder={newChatConfig.provider === 'omniroute' || newChatConfig.provider === '9route' ? 'Base URL (например, http://localhost:5000)' : 'Base URL'}
                value={newChatConfig.baseUrl || ''}
                onChange={(e) => setNewChatConfig({ ...newChatConfig, baseUrl: e.target.value })}
              />
            )}
            <input
              type="number"
              placeholder="Temperature (0-2)"
              step="0.1"
              value={newChatConfig.temperature}
              onChange={(e) => setNewChatConfig({ ...newChatConfig, temperature: parseFloat(e.target.value) })}
            />
            <input
              type="number"
              placeholder="Max Tokens"
              value={newChatConfig.maxTokens}
              onChange={(e) => setNewChatConfig({ ...newChatConfig, maxTokens: parseInt(e.target.value) })}
            />
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                Системный промпт (опционально)
                <span
                  className="tooltip-icon"
                  title="Системный промпт задает контекст и поведение модели. Например: 'Ты опытный программист на Python' или 'Отвечай кратко и по делу'"
                >
                  ❓
                </span>
              </label>
              <textarea
                placeholder="Например: Ты опытный программист. Отвечай кратко и с примерами кода."
                value={newChatConfig.systemPrompt || ''}
                onChange={(e) => setNewChatConfig({ ...newChatConfig, systemPrompt: e.target.value })}
                rows={4}
                style={{ resize: 'vertical', fontFamily: 'inherit', padding: '8px', width: '100%' }}
              />
            </div>

            {/* Настройки прокси */}
            <div style={{ marginTop: '16px', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                🌐 Настройки прокси
                <span
                  className="tooltip-icon"
                  title="Прокси позволяет маршрутизировать запросы через промежуточный сервер. Полезно для обхода блокировок или изменения геолокации."
                >
                  ❓
                </span>
              </label>

              <select
                value={newChatConfig.proxyMode || 'none'}
                onChange={(e) => setNewChatConfig({ ...newChatConfig, proxyMode: e.target.value as any })}
                style={{ marginBottom: '12px' }}
              >
                <option value="none">Без прокси</option>
                <option value="auto">Автоматический прокси (публичный)</option>
                <option value="manual">Ручной ввод прокси</option>
              </select>

              {newChatConfig.proxyMode === 'auto' && (
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Страна прокси
                  </label>
                  <select
                    value={newChatConfig.proxyCountry || 'Любая'}
                    onChange={(e) => setNewChatConfig({ ...newChatConfig, proxyCountry: e.target.value })}
                  >
                    {getCountryList().map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                  <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    ℹ️ Автоматически выберется рабочий публичный прокси из выбранной страны
                  </div>
                </div>
              )}

              {newChatConfig.proxyMode === 'manual' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Хост прокси (например, 123.45.67.89)"
                    value={newChatConfig.proxyHost || ''}
                    onChange={(e) => setNewChatConfig({ ...newChatConfig, proxyHost: e.target.value })}
                  />
                  <input
                    type="number"
                    placeholder="Порт (например, 8080)"
                    value={newChatConfig.proxyPort || ''}
                    onChange={(e) => setNewChatConfig({ ...newChatConfig, proxyPort: parseInt(e.target.value) || undefined })}
                  />
                  <input
                    type="text"
                    placeholder="Логин (опционально)"
                    value={newChatConfig.proxyUsername || ''}
                    onChange={(e) => setNewChatConfig({ ...newChatConfig, proxyUsername: e.target.value })}
                  />
                  <input
                    type="password"
                    placeholder="Пароль (опционально)"
                    value={newChatConfig.proxyPassword || ''}
                    onChange={(e) => setNewChatConfig({ ...newChatConfig, proxyPassword: e.target.value })}
                  />
                </div>
              )}
            </div>
            </div>
            <div className="modal-actions">
              <button onClick={handleCreateChat}>{editingChatId ? 'Сохранить' : 'Создать'}</button>
              <button onClick={handleCloseModal}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatList;
