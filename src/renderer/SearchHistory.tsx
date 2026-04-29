import React, { useState, useMemo } from 'react';
import { Chat, Message } from '../types';
import './SearchHistory.css';

interface SearchHistoryProps {
  chats: Chat[];
  onClose: () => void;
  onJumpToMessage: (chatId: string, messageId: string) => void;
}

type FilterType = 'all' | 'user' | 'assistant';
type SortType = 'newest' | 'oldest' | 'relevance';

interface SearchResult {
  chatId: string;
  chatName: string;
  message: Message;
  provider: string;
  model: string;
}

const SearchHistory: React.FC<SearchHistoryProps> = ({ chats, onClose, onJumpToMessage }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterProvider, setFilterProvider] = useState<string>('all');
  const [filterModel, setFilterModel] = useState<string>('all');
  const [sortType, setSortType] = useState<SortType>('newest');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);

  const allProviders = useMemo(() => {
    const providers = new Set<string>();
    chats.forEach(chat => providers.add(chat.config.provider));
    return Array.from(providers).sort();
  }, [chats]);

  const allModels = useMemo(() => {
    const models = new Set<string>();
    chats.forEach(chat => models.add(chat.config.model));
    return Array.from(models).sort();
  }, [chats]);

  const searchResults = useMemo(() => {
    let results: SearchResult[] = [];

    chats.forEach(chat => {
      chat.messages.forEach(message => {
        if (filterType !== 'all' && message.role !== filterType) return;
        if (filterProvider !== 'all' && chat.config.provider !== filterProvider) return;
        if (filterModel !== 'all' && chat.config.model !== filterModel) return;
        if (bookmarkedOnly && !message.bookmarked) return;

        if (dateFrom) {
          const fromDate = new Date(dateFrom).getTime();
          if (message.timestamp < fromDate) return;
        }

        if (dateTo) {
          const toDate = new Date(dateTo).getTime() + 86400000; // +1 день
          if (message.timestamp > toDate) return;
        }

        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          if (!message.content.toLowerCase().includes(query)) return;
        }

        results.push({
          chatId: chat.id,
          chatName: chat.config.name,
          message,
          provider: chat.config.provider,
          model: chat.config.model
        });
      });
    });

    if (sortType === 'newest') {
      results.sort((a, b) => b.message.timestamp - a.message.timestamp);
    } else if (sortType === 'oldest') {
      results.sort((a, b) => a.message.timestamp - b.message.timestamp);
    } else if (sortType === 'relevance' && searchQuery.trim()) {
      results.sort((a, b) => {
        const aCount = (a.message.content.toLowerCase().match(new RegExp(searchQuery.toLowerCase(), 'g')) || []).length;
        const bCount = (b.message.content.toLowerCase().match(new RegExp(searchQuery.toLowerCase(), 'g')) || []).length;
        return bCount - aCount;
      });
    }

    return results;
  }, [chats, searchQuery, filterType, filterProvider, filterModel, sortType, dateFrom, dateTo, bookmarkedOnly]);

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase()
        ? <mark key={i}>{part}</mark>
        : part
    );
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

    if (diffDays === 0) return 'Сегодня ' + date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Вчера ' + date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    if (diffDays < 7) return date.toLocaleDateString('ru-RU', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const truncateText = (text: string, maxLength: number = 200) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="search-history-overlay" onClick={onClose}>
      <div className="search-history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="search-history-header">
          <h2>🔍 Поиск по истории</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="search-controls">
          <input
            type="text"
            className="search-input"
            placeholder="Поиск по сообщениям..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />

          <div className="filters-row">
            <select value={filterType} onChange={(e) => setFilterType(e.target.value as FilterType)}>
              <option value="all">Все сообщения</option>
              <option value="user">Только мои</option>
              <option value="assistant">Только ответы</option>
            </select>

            <select value={filterProvider} onChange={(e) => setFilterProvider(e.target.value)}>
              <option value="all">Все провайдеры</option>
              {allProviders.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            <select value={filterModel} onChange={(e) => setFilterModel(e.target.value)}>
              <option value="all">Все модели</option>
              {allModels.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            <select value={sortType} onChange={(e) => setSortType(e.target.value as SortType)}>
              <option value="newest">Сначала новые</option>
              <option value="oldest">Сначала старые</option>
              {searchQuery.trim() && <option value="relevance">По релевантности</option>}
            </select>
          </div>

          <div className="filters-row">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="От даты"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="До даты"
            />
            <label className="bookmark-filter">
              <input
                type="checkbox"
                checked={bookmarkedOnly}
                onChange={(e) => setBookmarkedOnly(e.target.checked)}
              />
              <span>Только закладки</span>
            </label>
          </div>
        </div>

        <div className="search-stats">
          Найдено: <strong>{searchResults.length}</strong> сообщений
        </div>

        <div className="search-results">
          {searchResults.length === 0 ? (
            <div className="no-results">
              {searchQuery.trim() ? '🔍 Ничего не найдено' : '💬 Введите запрос для поиска'}
            </div>
          ) : (
            searchResults.map((result, index) => (
              <div
                key={`${result.chatId}-${result.message.id}-${index}`}
                className="search-result-item"
                onClick={() => {
                  onJumpToMessage(result.chatId, result.message.id);
                  onClose();
                }}
              >
                <div className="result-header">
                  <span className="result-chat-name">{result.chatName}</span>
                  <span className="result-provider">{result.provider}</span>
                  <span className="result-model">{result.model}</span>
                  <span className="result-date">{formatDate(result.message.timestamp)}</span>
                </div>
                <div className={`result-role ${result.message.role}`}>
                  {result.message.role === 'user' ? '👤 Вы' : '🤖 Ассистент'}
                  {result.message.bookmarked && ' ⭐'}
                </div>
                <div className="result-content">
                  {highlightText(truncateText(result.message.content), searchQuery)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchHistory;
