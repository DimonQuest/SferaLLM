import React, { useState, useEffect } from 'react';
import { Chat, ChatConfig } from '../types';
import { getMaxTokensForLength } from '../types/settings';
import { getSettings } from './Settings';
import ChatWindow from './ChatWindow';
import ChatList from './ChatList';
import DraggableWindow from './DraggableWindow';
import Settings from './Settings';
import GlobalChat from './GlobalChat';
import PromptTemplates from './PromptTemplates';
import ExportImport from './ExportImport';
import Analytics from './Analytics';
import SearchHistory from './SearchHistory';
import CompareResponses from './CompareResponses';
import LockScreen, { checkAutoLock, updateActivity } from './LockScreen';
import ProgressIndicator from './ProgressIndicator';
import UpdateNotification from './UpdateNotification';
import { AutoSaveManager } from '../utils/autoSave';
import { MultiAgentSystem, CollaborationMode } from '../utils/multiAgentSystem';
import './App.css';

const STORAGE_KEY = 'multimodel-chats';
const ACTIVE_CHAT_KEY = 'multimodel-active-chat';
const LAYOUT_KEY = 'multimodel-layout';
const SIDEBAR_VISIBLE_KEY = 'multimodel-sidebar-visible';
const THEME_KEY = 'multimodel-theme';

type LayoutType = 'horizontal' | 'vertical' | 'grid' | 'custom';

const App: React.FC = () => {
  const [chats, setChats] = useState<Chat[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [activeChat, setActiveChat] = useState<string | null>(() => {
    return localStorage.getItem(ACTIVE_CHAT_KEY);
  });
  const [layout, setLayout] = useState<LayoutType>(() => {
    return (localStorage.getItem(LAYOUT_KEY) as LayoutType) || 'horizontal';
  });
  const [sidebarVisible, setSidebarVisible] = useState<boolean>(() => {
    const saved = localStorage.getItem(SIDEBAR_VISIBLE_KEY);
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) return saved as 'dark' | 'light';

    // Загружаем из настроек если нет в THEME_KEY
    const settingsSaved = localStorage.getItem('app-settings');
    if (settingsSaved) {
      const settings = JSON.parse(settingsSaved);
      return settings.theme || 'dark';
    }
    return 'dark';
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showGlobalChat, setShowGlobalChat] = useState(false);
  const [showPromptTemplates, setShowPromptTemplates] = useState(false);
  const [showExportImport, setShowExportImport] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [showCompareResponses, setShowCompareResponses] = useState(false);
  const [selectedTemplatePrompt, setSelectedTemplatePrompt] = useState<string>('');
  const [isLocked, setIsLocked] = useState(() => checkAutoLock());

  // Progress indicator states
  const [progressMode, setProgressMode] = useState<'collaborative' | 'orchestrator' | null>(null);
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [orchestratorSteps, setOrchestratorSteps] = useState<Array<{ step: string; data: any; timestamp: number }>>([]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);

    // Применяем размер шрифта из настроек
    const settingsSaved = localStorage.getItem('app-settings');
    if (settingsSaved) {
      const settings = JSON.parse(settingsSaved);
      const fontSize = settings.fontSize || 'medium';
      document.documentElement.style.fontSize = fontSize === 'small' ? '14px' : fontSize === 'large' ? '18px' : '16px';
    }
  }, [theme]);

  useEffect(() => {
    // Отслеживание активности пользователя
    const handleActivity = () => {
      if (!isLocked) {
        updateActivity();
      }
    };

    // Проверка автоблокировки каждую минуту
    const checkLockInterval = setInterval(() => {
      if (!isLocked && checkAutoLock()) {
        setIsLocked(true);
      }
    }, 60000); // каждую минуту

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);

    return () => {
      clearInterval(checkLockInterval);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
    };
  }, [isLocked]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    if (activeChat) {
      localStorage.setItem(ACTIVE_CHAT_KEY, activeChat);
    }
  }, [activeChat]);

  useEffect(() => {
    localStorage.setItem(LAYOUT_KEY, layout);
  }, [layout]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_VISIBLE_KEY, JSON.stringify(sidebarVisible));
  }, [sidebarVisible]);

  useEffect(() => {
    // Отключаем проверку восстановления - работает некорректно
    // const needsRecovery = AutoSaveManager.checkCrashRecovery();

    // Очистка старых черновиков
    AutoSaveManager.clearOldDrafts();

    // Запуск автосохранения
    AutoSaveManager.startAutoSave(() => chats, 30000);

    return () => {
      AutoSaveManager.stopAutoSave();
    };
  }, []);

  useEffect(() => {
    // Слушаем события из главного меню через безопасный API
    console.log('Checking electronAPI:', window.electronAPI);

    if (!window.electronAPI) {
      console.error('electronAPI is not available!');
      return;
    }

    console.log('Setting up IPC listeners...');

    const handleLayoutChange = (newLayout: LayoutType) => {
      console.log('Layout change:', newLayout);
      setLayout(newLayout);
    };

    const handleToggleSidebar = () => {
      console.log('Toggle sidebar');
      setSidebarVisible(prev => !prev);
    };

    const handleOpenSettings = () => {
      console.log('Open settings');
      setShowSettings(true);
    };

    const handleToggleGlobalChat = () => {
      console.log('Toggle global chat');
      setShowGlobalChat(prev => !prev);
    };

    const handleOpenPromptTemplates = () => {
      console.log('Open prompt templates');
      setShowPromptTemplates(true);
    };

    const handleOpenExportImport = () => {
      console.log('Open export/import');
      setShowExportImport(true);
    };

    const handleOpenAnalytics = () => {
      console.log('Open analytics');
      setShowAnalytics(true);
    };

    const handleOpenSearchHistory = () => {
      console.log('Open search history');
      setShowSearchHistory(true);
    };

    const handleOpenCompareResponses = () => {
      console.log('Open compare responses');
      setShowCompareResponses(true);
    };

    const handleClearAllChats = () => {
      console.log('Clear all chats');
      if (confirm('Вы уверены, что хотите очистить все чаты?')) {
        setChats(chats.map(c => ({ ...c, messages: [], tokensUsed: 0 })));
      }
    };

    const handleSwitchChat = (index: number) => {
      console.log('Switch chat:', index);
      const enabledChats = chats.filter(c => c.enabled);
      if (enabledChats[index]) {
        setActiveChat(enabledChats[index].id);
      }
    };

    try {
      window.electronAPI.on('change-layout', handleLayoutChange);
      window.electronAPI.on('toggle-sidebar', handleToggleSidebar);
      window.electronAPI.on('open-settings', handleOpenSettings);
      window.electronAPI.on('toggle-global-chat', handleToggleGlobalChat);
      window.electronAPI.on('open-prompt-templates', handleOpenPromptTemplates);
      window.electronAPI.on('open-export-import', handleOpenExportImport);
      window.electronAPI.on('open-analytics', handleOpenAnalytics);
      window.electronAPI.on('open-search-history', handleOpenSearchHistory);
      window.electronAPI.on('open-compare-responses', handleOpenCompareResponses);
      window.electronAPI.on('clear-all-chats', handleClearAllChats);
      window.electronAPI.on('switch-chat', handleSwitchChat);

      console.log('IPC listeners registered successfully');
    } catch (error) {
      console.error('Error setting up IPC listeners:', error);
    }

    return () => {
      try {
        if (!window.electronAPI) return;
        window.electronAPI.removeListener('change-layout', handleLayoutChange);
        window.electronAPI.removeListener('toggle-sidebar', handleToggleSidebar);
        window.electronAPI.removeListener('open-settings', handleOpenSettings);
        window.electronAPI.removeListener('toggle-global-chat', handleToggleGlobalChat);
        window.electronAPI.removeListener('open-prompt-templates', handleOpenPromptTemplates);
        window.electronAPI.removeListener('open-export-import', handleOpenExportImport);
        window.electronAPI.removeListener('open-analytics', handleOpenAnalytics);
        window.electronAPI.removeListener('open-search-history', handleOpenSearchHistory);
        window.electronAPI.removeListener('open-compare-responses', handleOpenCompareResponses);
        window.electronAPI.removeListener('clear-all-chats', handleClearAllChats);
        window.electronAPI.removeListener('switch-chat', handleSwitchChat);
      } catch (error) {
        console.error('Error removing IPC listeners:', error);
      }
    };
  }, []);

  const createNewChat = (config: ChatConfig) => {
    const newChat: Chat = {
      id: Date.now().toString(),
      config,
      messages: [],
      isActive: true,
      enabled: true,
      tokensUsed: 0,
      tokenLimit: undefined
    };
    setChats([...chats, newChat]);
    setActiveChat(newChat.id);
  };

  const deleteChat = (chatId: string) => {
    setChats(chats.filter(c => c.id !== chatId));
    if (activeChat === chatId) {
      setActiveChat(chats[0]?.id || null);
    }
  };

  const updateChat = (chatId: string, messages: any[]) => {
    setChats(chats.map(c => {
      if (c.id === chatId) {
        // Простой подсчет токенов (примерно 4 символа = 1 токен)
        const totalTokens = messages.reduce((sum, msg) => {
          return sum + Math.ceil(msg.content.length / 4);
        }, 0);
        return { ...c, messages, tokensUsed: totalTokens };
      }
      return c;
    }));
  };

  const updateChatConfig = (chatId: string, config: ChatConfig) => {
    setChats(chats.map(c =>
      c.id === chatId ? { ...c, config } : c
    ));
  };

  const toggleChatEnabled = (chatId: string) => {
    setChats(chats.map(c =>
      c.id === chatId ? { ...c, enabled: !c.enabled } : c
    ));
  };

  const clearChat = (chatId: string) => {
    setChats(chats.map(c =>
      c.id === chatId ? { ...c, messages: [], tokensUsed: 0 } : c
    ));
  };

  const changeResponseLength = (chatId: string, length: 'short' | 'standard' | 'detailed') => {
    setChats(chats.map(c =>
      c.id === chatId ? { ...c, responseLength: length } : c
    ));
  };

  const handleImportChats = (importedChats: Chat[]) => {
    setChats([...chats, ...importedChats]);
  };

  const toggleChatMaximize = (chatId: string) => {
    setChats(chats.map(c =>
      c.id === chatId ? { ...c, isMaximized: !c.isMaximized } : { ...c, isMaximized: false }
    ));
  };

  const handleSelectChat = (chatId: string) => {
    const selectedChat = chats.find(c => c.id === chatId);
    const hasMaximized = chats.some(c => c.isMaximized);

    if (hasMaximized && selectedChat) {
      // Если есть развернутый чат, разворачиваем выбранный и сворачиваем остальные
      setChats(chats.map(c =>
        c.id === chatId ? { ...c, isMaximized: true } : { ...c, isMaximized: false }
      ));
    }

    setActiveChat(chatId);
  };

  const handleSendToAll = async (message: string, mode: CollaborationMode = 'normal', orchestratorId?: string) => {
    const enabledChats = chats.filter(c => c.enabled);
    const settings = getSettings();
    const maxTokens = getMaxTokensForLength(settings.responseLength);

    if (enabledChats.length < 2) {
      alert('Включите минимум 2 чата для работы');
      return;
    }

    // Инициализируем прогресс
    if (mode === 'collaborative') {
      setProgressMode('collaborative');
      setCurrentRound(1);
    } else if (mode === 'orchestrator') {
      setProgressMode('orchestrator');
      setOrchestratorSteps([]);
    }

    // Добавляем сообщение пользователя во все чаты
    const userMessage = {
      id: Date.now().toString() + Math.random(),
      role: 'user' as const,
      content: message,
      timestamp: Date.now()
    };

    // Добавляем индикаторы загрузки
    setChats(prevChats => prevChats.map(c => {
      if (!c.enabled) return c;
      const loadingMessage = {
        id: 'loading-' + c.id,
        role: 'assistant' as const,
        content: mode === 'collaborative' ? '🤝 Участвую в обсуждении...' :
                 mode === 'orchestrator' ? (c.id === orchestratorId ? '👑 Координирую работу...' : '⚙️ Выполняю задачу...') :
                 'Думаю...',
        timestamp: Date.now()
      };
      return {
        ...c,
        messages: [...c.messages, userMessage, loadingMessage]
      };
    }));

    try {
      let responses;

      switch (mode) {
        case 'collaborative':
          // Режим совместной работы
          responses = await MultiAgentSystem.collaborativeMode(
            message,
            enabledChats,
            maxTokens,
            getApiUrl,
            (round, roundResponses) => {
              // Обновляем прогресс
              setCurrentRound(round);

              // Обновляем чаты после каждого раунда
              setChats(prevChats => prevChats.map(c => {
                const response = roundResponses.find(r => r.chatId === c.id);
                if (response) {
                  const roundMessage = {
                    id: `round-${round}-${c.id}`,
                    role: 'assistant' as const,
                    content: `**Раунд ${round}:**\n\n${response.content}`,
                    timestamp: response.timestamp
                  };
                  return {
                    ...c,
                    messages: c.messages.filter(m => m.id !== 'loading-' + c.id).concat(roundMessage)
                  };
                }
                return c;
              }));
            }
          );
          break;

        case 'orchestrator':
          if (!orchestratorId) {
            throw new Error('Orchestrator ID required');
          }
          // Режим оркестратора
          responses = await MultiAgentSystem.orchestratorMode(
            message,
            enabledChats,
            orchestratorId,
            maxTokens,
            getApiUrl,
            (step, data) => {
              // Обновляем прогресс
              setOrchestratorSteps(prev => [...prev, { step, data, timestamp: Date.now() }]);
            }
          );
          break;

        default:
          // Обычный режим
          responses = await MultiAgentSystem.normalMode(
            message,
            enabledChats,
            maxTokens,
            getApiUrl
          );
      }

      // Обновляем чаты с финальными ответами
      setChats(prevChats => prevChats.map(c => {
        const response = responses.find(r => r.chatId === c.id);
        if (response) {
          const assistantMessage = {
            id: (Date.now() + 1).toString() + Math.random(),
            role: 'assistant' as const,
            content: response.content,
            timestamp: response.timestamp
          };
          return {
            ...c,
            messages: c.messages.filter(m => !m.id.startsWith('loading-') && !m.id.startsWith('round-')).concat(assistantMessage)
          };
        }
        return {
          ...c,
          messages: c.messages.filter(m => !m.id.startsWith('loading-'))
        };
      }));

      // Скрываем прогресс через 2 секунды после завершения
      setTimeout(() => {
        setProgressMode(null);
        setCurrentRound(0);
        setOrchestratorSteps([]);
      }, 2000);

    } catch (error) {
      console.error('Error in multi-agent system:', error);
      // Убираем индикаторы загрузки при ошибке
      setChats(prevChats => prevChats.map(c => ({
        ...c,
        messages: c.messages.filter(m => !m.id.startsWith('loading-'))
      })));
      // Скрываем прогресс
      setProgressMode(null);
      setCurrentRound(0);
      setOrchestratorSteps([]);
      alert('Ошибка при выполнении запроса: ' + (error as Error).message);
    }
  };

  const getApiUrl = (config: ChatConfig): string => {
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

    if (config.provider === 'omniroute' || config.provider === '9route') {
      if (config.baseUrl) {
        const base = config.baseUrl.replace(/\/+$/, '');
        return base.endsWith('/chat/completions') ? base : base + '/chat/completions';
      }
      return 'http://localhost:20129/chat/completions';
    }

    if (config.provider === 'custom' && config.baseUrl) {
      const base = config.baseUrl.replace(/\/+$/, '');
      if (!base.endsWith('/chat/completions')) {
        return base + '/v1/chat/completions';
      }
      return base;
    }

    return urls[config.provider] || '';
  };

  const handleJumpToMessage = (chatId: string, messageId: string) => {
    setActiveChat(chatId);
    // Прокрутка к сообщению будет выполнена автоматически при рендере
    setTimeout(() => {
      const messageElement = document.getElementById(`message-${messageId}`);
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        messageElement.style.animation = 'highlight 2s ease-out';
      }
    }, 100);
  };

  const toggleBookmark = (chatId: string, messageId: string) => {
    setChats(chats.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          messages: chat.messages.map(msg =>
            msg.id === messageId ? { ...msg, bookmarked: !msg.bookmarked } : msg
          )
        };
      }
      return chat;
    }));
  };

  const reorderChats = (newChats: Chat[]) => {
    setChats(newChats);
  };

  const handleUnlock = (password: string) => {
    setIsLocked(false);
    updateActivity();
  };

  return (
    <div className="app">
      <UpdateNotification />
      <LockScreen isLocked={isLocked} onUnlock={handleUnlock} />
      {sidebarVisible && (
        <ChatList
          chats={chats}
          activeChat={activeChat}
          onSelectChat={handleSelectChat}
          onCreateChat={createNewChat}
          onDeleteChat={deleteChat}
          onUpdateChat={updateChatConfig}
          onToggleEnabled={toggleChatEnabled}
          onClearChat={clearChat}
          onReorderChats={reorderChats}
          layout={layout}
          onLayoutChange={setLayout}
        />
      )}
      <button
        className={`sidebar-toggle ${sidebarVisible ? 'visible' : 'hidden'}`}
        onClick={() => setSidebarVisible(!sidebarVisible)}
        title={sidebarVisible ? 'Скрыть панель' : 'Показать панель'}
      >
        {sidebarVisible ? '◀' : '▶'}
      </button>
      <div className="main-content">
        <div className={`chat-windows ${layout}`}>
          {layout === 'custom' ? (
            chats.filter(chat => chat.enabled).map(chat => (
              <DraggableWindow
                key={chat.id}
                chat={chat}
                isActive={chat.id === activeChat}
                onUpdateMessages={(msgs) => updateChat(chat.id, msgs)}
                onFocus={() => handleSelectChat(chat.id)}
              />
            ))
          ) : (
            chats.filter(chat => chat.enabled).map(chat => (
              <ChatWindow
                key={chat.id}
                chat={chat}
                isActive={chat.id === activeChat}
                onUpdateMessages={(msgs) => updateChat(chat.id, msgs)}
                onFocus={() => handleSelectChat(chat.id)}
                onToggleEnabled={() => toggleChatEnabled(chat.id)}
                onToggleMaximize={() => toggleChatMaximize(chat.id)}
                onClearChat={() => clearChat(chat.id)}
                onChangeResponseLength={(length) => changeResponseLength(chat.id, length)}
                onToggleBookmark={(messageId) => toggleBookmark(chat.id, messageId)}
              />
            ))
          )}
        </div>
      </div>
      {showSettings && <Settings onClose={() => setShowSettings(false)} onThemeChange={setTheme} />}
      {showGlobalChat && (
        <GlobalChat
          onSendToAll={handleSendToAll}
          onClose={() => setShowGlobalChat(false)}
          availableChats={chats.map(c => ({
            id: c.id,
            name: c.config.name,
            enabled: c.enabled
          }))}
        />
      )}
      {showPromptTemplates && (
        <PromptTemplates
          onClose={() => setShowPromptTemplates(false)}
          onSelectTemplate={(prompt) => {
            setSelectedTemplatePrompt(prompt);
            setShowPromptTemplates(false);
            setShowGlobalChat(true);
          }}
        />
      )}
      {showExportImport && (
        <ExportImport
          chats={chats}
          onImport={handleImportChats}
          onClose={() => setShowExportImport(false)}
        />
      )}
      {showAnalytics && (
        <Analytics
          chats={chats}
          onClose={() => setShowAnalytics(false)}
        />
      )}
      {showSearchHistory && (
        <SearchHistory
          chats={chats}
          onClose={() => setShowSearchHistory(false)}
          onJumpToMessage={handleJumpToMessage}
        />
      )}
      {showCompareResponses && (
        <CompareResponses
          chats={chats}
          onClose={() => setShowCompareResponses(false)}
        />
      )}
      <ProgressIndicator
        mode={progressMode || 'collaborative'}
        currentRound={currentRound}
        steps={orchestratorSteps}
        isActive={progressMode !== null}
      />
    </div>
  );
};

export default App;
