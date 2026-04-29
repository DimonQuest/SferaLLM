import React, { useState, useMemo } from 'react';
import { Chat } from '../types';
import './Analytics.css';

interface AnalyticsProps {
  chats: Chat[];
  onClose: () => void;
}

interface ProviderStats {
  provider: string;
  totalMessages: number;
  totalTokens: number;
  avgResponseTime: number;
  estimatedCost: number;
}

// Примерные цены за 1K токенов (в USD)
const TOKEN_PRICES: Record<string, { input: number; output: number }> = {
  'openai': { input: 0.03, output: 0.06 },
  'anthropic': { input: 0.015, output: 0.075 },
  'google': { input: 0.00025, output: 0.00125 },
  'mistral': { input: 0.0007, output: 0.0007 },
  'cohere': { input: 0.001, output: 0.002 },
  'perplexity': { input: 0.001, output: 0.001 },
  'groq': { input: 0.0001, output: 0.0001 },
  'xai': { input: 0.01, output: 0.01 },
  'deepseek': { input: 0.0001, output: 0.0002 },
  'openrouter': { input: 0.001, output: 0.001 },
  'omniroute': { input: 0.001, output: 0.001 },
  'custom': { input: 0.001, output: 0.001 }
};

const Analytics: React.FC<AnalyticsProps> = ({ chats, onClose }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'today' | 'week' | 'month'>('all');

  const filteredChats = useMemo(() => {
    if (selectedPeriod === 'all') return chats;

    const now = Date.now();
    const periods = {
      today: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000
    };

    return chats.map(chat => ({
      ...chat,
      messages: chat.messages.filter(msg => now - msg.timestamp < periods[selectedPeriod])
    }));
  }, [chats, selectedPeriod]);

  const stats = useMemo(() => {
    const providerMap = new Map<string, ProviderStats>();

    filteredChats.forEach(chat => {
      const provider = chat.config.provider;
      const existing = providerMap.get(provider) || {
        provider,
        totalMessages: 0,
        totalTokens: 0,
        avgResponseTime: 0,
        estimatedCost: 0
      };

      existing.totalMessages += chat.messages.length;
      existing.totalTokens += chat.tokensUsed;

      // Примерная стоимость (50/50 input/output)
      const prices = TOKEN_PRICES[provider] || TOKEN_PRICES['custom'];
      const avgPrice = (prices.input + prices.output) / 2;
      existing.estimatedCost += (chat.tokensUsed / 1000) * avgPrice;

      providerMap.set(provider, existing);
    });

    return Array.from(providerMap.values()).sort((a, b) => b.totalTokens - a.totalTokens);
  }, [filteredChats]);

  const totalStats = useMemo(() => {
    return {
      totalChats: filteredChats.length,
      totalMessages: filteredChats.reduce((sum, chat) => sum + chat.messages.length, 0),
      totalTokens: filteredChats.reduce((sum, chat) => sum + chat.tokensUsed, 0),
      totalCost: stats.reduce((sum, s) => sum + s.estimatedCost, 0)
    };
  }, [filteredChats, stats]);

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
      custom: '⚙️'
    };
    return icons[provider] || '💬';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="analytics-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📊 Аналитика и статистика</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="analytics-toolbar">
          <div className="period-selector">
            <button
              className={selectedPeriod === 'all' ? 'active' : ''}
              onClick={() => setSelectedPeriod('all')}
            >
              Всё время
            </button>
            <button
              className={selectedPeriod === 'today' ? 'active' : ''}
              onClick={() => setSelectedPeriod('today')}
            >
              Сегодня
            </button>
            <button
              className={selectedPeriod === 'week' ? 'active' : ''}
              onClick={() => setSelectedPeriod('week')}
            >
              Неделя
            </button>
            <button
              className={selectedPeriod === 'month' ? 'active' : ''}
              onClick={() => setSelectedPeriod('month')}
            >
              Месяц
            </button>
          </div>
        </div>

        <div className="analytics-content">
          <div className="summary-cards">
            <div className="summary-card">
              <div className="card-icon">💬</div>
              <div className="card-content">
                <div className="card-value">{totalStats.totalChats}</div>
                <div className="card-label">Чатов</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="card-icon">📝</div>
              <div className="card-content">
                <div className="card-value">{totalStats.totalMessages.toLocaleString()}</div>
                <div className="card-label">Сообщений</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="card-icon">🎯</div>
              <div className="card-content">
                <div className="card-value">{totalStats.totalTokens.toLocaleString()}</div>
                <div className="card-label">Токенов</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="card-icon">💰</div>
              <div className="card-content">
                <div className="card-value">${totalStats.totalCost.toFixed(2)}</div>
                <div className="card-label">Примерная стоимость</div>
              </div>
            </div>
          </div>

          <div className="provider-stats">
            <h3>Статистика по провайдерам</h3>
            {stats.length === 0 ? (
              <div className="no-data">Нет данных за выбранный период</div>
            ) : (
              <div className="stats-table">
                <div className="stats-header">
                  <div>Провайдер</div>
                  <div>Сообщений</div>
                  <div>Токенов</div>
                  <div>Стоимость</div>
                </div>
                {stats.map(stat => (
                  <div key={stat.provider} className="stats-row">
                    <div className="provider-cell">
                      <span className="provider-icon">{getProviderIcon(stat.provider)}</span>
                      <span className="provider-name">{stat.provider}</span>
                    </div>
                    <div>{stat.totalMessages.toLocaleString()}</div>
                    <div>{stat.totalTokens.toLocaleString()}</div>
                    <div>${stat.estimatedCost.toFixed(3)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="info-note">
            <strong>Примечание:</strong> Стоимость рассчитана приблизительно на основе публичных цен провайдеров.
            Фактическая стоимость может отличаться в зависимости от вашего тарифного плана.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
