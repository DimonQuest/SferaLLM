import React, { useState } from 'react';
import { Chat, Message } from '../types';
import MessageContent from './MessageContent';
import './CompareResponses.css';

interface CompareResponsesProps {
  chats: Chat[];
  onClose: () => void;
}

interface ComparisonPair {
  chat1: Chat;
  chat2: Chat;
  messageIndex: number;
}

const CompareResponses: React.FC<CompareResponsesProps> = ({ chats, onClose }) => {
  const [selectedChat1, setSelectedChat1] = useState<string>('');
  const [selectedChat2, setSelectedChat2] = useState<string>('');
  const [messageIndex, setMessageIndex] = useState<number>(0);
  const [ratings, setRatings] = useState<Record<string, { chat1: number; chat2: number }>>({});

  const enabledChats = chats.filter(c => c.enabled && c.messages.length > 0);

  const chat1 = enabledChats.find(c => c.id === selectedChat1);
  const chat2 = enabledChats.find(c => c.id === selectedChat2);

  const getAssistantMessages = (chat: Chat): Message[] => {
    return chat.messages.filter(m => m.role === 'assistant');
  };

  const chat1Messages = chat1 ? getAssistantMessages(chat1) : [];
  const chat2Messages = chat2 ? getAssistantMessages(chat2) : [];

  const maxMessages = Math.max(chat1Messages.length, chat2Messages.length);

  const handleRate = (chatId: string, rating: number) => {
    const key = `${messageIndex}`;
    setRatings({
      ...ratings,
      [key]: {
        ...ratings[key],
        [chatId === selectedChat1 ? 'chat1' : 'chat2']: rating
      }
    });
  };

  const getDifferences = (text1: string, text2: string): { added: string[]; removed: string[] } => {
    const words1 = text1.split(/\s+/);
    const words2 = text2.split(/\s+/);

    const added = words2.filter(w => !words1.includes(w));
    const removed = words1.filter(w => !words2.includes(w));

    return { added, removed };
  };

  const highlightDifferences = (text: string, differences: string[], type: 'added' | 'removed'): JSX.Element => {
    const words = text.split(/(\s+)/);
    return (
      <>
        {words.map((word, i) => {
          const isHighlight = differences.some(d => word.toLowerCase().includes(d.toLowerCase()));
          if (isHighlight) {
            return (
              <span key={i} className={type === 'added' ? 'diff-added' : 'diff-removed'}>
                {word}
              </span>
            );
          }
          return <span key={i}>{word}</span>;
        })}
      </>
    );
  };

  const message1 = chat1Messages[messageIndex];
  const message2 = chat2Messages[messageIndex];

  const differences = message1 && message2 ? getDifferences(message1.content, message2.content) : { added: [], removed: [] };

  return (
    <div className="compare-overlay" onClick={onClose}>
      <div className="compare-modal" onClick={(e) => e.stopPropagation()}>
        <div className="compare-header">
          <h2>🔄 Сравнение ответов</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="compare-controls">
          <div className="chat-selectors">
            <div className="selector-group">
              <label>Чат 1:</label>
              <select value={selectedChat1} onChange={(e) => { setSelectedChat1(e.target.value); setMessageIndex(0); }}>
                <option value="">Выберите чат</option>
                {enabledChats.map(chat => (
                  <option key={chat.id} value={chat.id}>
                    {chat.config.name} ({chat.config.provider} - {chat.config.model})
                  </option>
                ))}
              </select>
            </div>

            <div className="selector-group">
              <label>Чат 2:</label>
              <select value={selectedChat2} onChange={(e) => { setSelectedChat2(e.target.value); setMessageIndex(0); }}>
                <option value="">Выберите чат</option>
                {enabledChats.map(chat => (
                  <option key={chat.id} value={chat.id} disabled={chat.id === selectedChat1}>
                    {chat.config.name} ({chat.config.provider} - {chat.config.model})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {chat1 && chat2 && maxMessages > 0 && (
            <div className="message-navigator">
              <button
                onClick={() => setMessageIndex(Math.max(0, messageIndex - 1))}
                disabled={messageIndex === 0}
              >
                ← Предыдущий
              </button>
              <span>Ответ {messageIndex + 1} из {maxMessages}</span>
              <button
                onClick={() => setMessageIndex(Math.min(maxMessages - 1, messageIndex + 1))}
                disabled={messageIndex >= maxMessages - 1}
              >
                Следующий →
              </button>
            </div>
          )}
        </div>

        {chat1 && chat2 && message1 && message2 ? (
          <div className="compare-content">
            <div className="compare-column">
              <div className="column-header">
                <h3>{chat1.config.name}</h3>
                <div className="model-info">
                  <span className="provider-badge">{chat1.config.provider}</span>
                  <span className="model-badge">{chat1.config.model}</span>
                </div>
                <div className="rating-buttons">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button
                      key={rating}
                      className={`rating-btn ${ratings[messageIndex]?.chat1 === rating ? 'active' : ''}`}
                      onClick={() => handleRate(selectedChat1, rating)}
                      title={`${rating} звезд`}
                    >
                      {ratings[messageIndex]?.chat1 >= rating ? '⭐' : '☆'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="message-box">
                <div className="message-meta">
                  <span>Длина: {message1.content.length} символов</span>
                  <span>Время: {new Date(message1.timestamp).toLocaleTimeString('ru-RU')}</span>
                </div>
                <div className="message-content-compare">
                  <MessageContent content={message1.content} />
                </div>
              </div>
            </div>

            <div className="compare-divider">
              <div className="diff-stats">
                <div className="stat-item added">
                  <span>+{differences.added.length}</span>
                  <small>добавлено</small>
                </div>
                <div className="stat-item removed">
                  <span>-{differences.removed.length}</span>
                  <small>удалено</small>
                </div>
              </div>
            </div>

            <div className="compare-column">
              <div className="column-header">
                <h3>{chat2.config.name}</h3>
                <div className="model-info">
                  <span className="provider-badge">{chat2.config.provider}</span>
                  <span className="model-badge">{chat2.config.model}</span>
                </div>
                <div className="rating-buttons">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button
                      key={rating}
                      className={`rating-btn ${ratings[messageIndex]?.chat2 === rating ? 'active' : ''}`}
                      onClick={() => handleRate(selectedChat2, rating)}
                      title={`${rating} звезд`}
                    >
                      {ratings[messageIndex]?.chat2 >= rating ? '⭐' : '☆'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="message-box">
                <div className="message-meta">
                  <span>Длина: {message2.content.length} символов</span>
                  <span>Время: {new Date(message2.timestamp).toLocaleTimeString('ru-RU')}</span>
                </div>
                <div className="message-content-compare">
                  <MessageContent content={message2.content} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="no-comparison">
            {!chat1 || !chat2 ? (
              <p>Выберите два чата для сравнения</p>
            ) : (
              <p>В выбранных чатах нет сообщений для сравнения</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompareResponses;
