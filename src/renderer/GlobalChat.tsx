import React, { useState, useRef, useEffect } from 'react';
import VoiceInput from './VoiceInput';
import './GlobalChat.css';

type CollaborationMode = 'normal' | 'collaborative' | 'orchestrator';

interface GlobalChatProps {
  onSendToAll: (message: string, mode: CollaborationMode, orchestratorId?: string) => void;
  onClose: () => void;
  availableChats: Array<{ id: string; name: string; enabled: boolean }>;
}

const GlobalChat: React.FC<GlobalChatProps> = ({ onSendToAll, onClose, availableChats }) => {
  const [input, setInput] = useState('');
  const [voiceActive, setVoiceActive] = useState(false);
  const [mode, setMode] = useState<CollaborationMode>('normal');
  const [orchestratorId, setOrchestratorId] = useState<string>('');
  const [position, setPosition] = useState({ x: window.innerWidth / 2 - 250, y: window.innerHeight / 2 - 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isSending, setIsSending] = useState(false);
  const windowRef = useRef<HTMLDivElement>(null);

  const enabledChats = availableChats.filter(c => c.enabled);

  useEffect(() => {
    // Автоматически выбираем первый активный чат как оркестратора
    if (mode === 'orchestrator' && !orchestratorId && enabledChats.length > 0) {
      setOrchestratorId(enabledChats[0].id);
    }
  }, [mode, enabledChats]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.global-chat-header')) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleSend = async () => {
    if (input.trim() && !isSending) {
      setIsSending(true);
      try {
        await onSendToAll(input, mode, mode === 'orchestrator' ? orchestratorId : undefined);
      } finally {
        setInput('');
        setIsSending(false);
      }
    }
  };

  const handleVoiceTranscript = (text: string) => {
    setInput(prev => prev + (prev ? ' ' : '') + text);
  };

  const getModeDescription = () => {
    switch (mode) {
      case 'normal':
        return 'Все AI отвечают параллельно и независимо';
      case 'collaborative':
        return 'AI обсуждают задачу между собой в несколько раундов';
      case 'orchestrator':
        return 'Главный AI координирует работу остальных';
      default:
        return '';
    }
  };

  return (
    <div
      ref={windowRef}
      className="global-chat-window"
      style={{ left: position.x, top: position.y }}
      onMouseDown={handleMouseDown}
    >
      <div className="global-chat-header">
        <span>📢 Общий чат</span>
        <button onClick={onClose} className="close-global-btn">×</button>
      </div>
      <div className="global-chat-body">
        {/* Выбор режима */}
        <div className="mode-selector">
          <label>Режим работы:</label>
          <select value={mode} onChange={(e) => setMode(e.target.value as CollaborationMode)}>
            <option value="normal">🔹 Обычный</option>
            <option value="collaborative">🤝 Совместная работа</option>
            <option value="orchestrator">👑 Оркестратор</option>
          </select>
          <div className="mode-description">{getModeDescription()}</div>
        </div>

        {/* Выбор главного чата для режима оркестратора */}
        {mode === 'orchestrator' && (
          <div className="orchestrator-selector">
            <label>Главный AI (координатор):</label>
            <select
              value={orchestratorId}
              onChange={(e) => setOrchestratorId(e.target.value)}
            >
              {enabledChats.map(chat => (
                <option key={chat.id} value={chat.id}>
                  👑 {chat.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Информация о количестве активных чатов */}
        <div className="active-chats-info">
          Активных чатов: <strong>{enabledChats.length}</strong>
          {enabledChats.length < 2 && (
            <span className="warning"> ⚠️ Включите минимум 2 чата</span>
          )}
        </div>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
          placeholder="Введите сообщение для всех чатов..."
          rows={4}
          disabled={isSending}
        />
        <div className="global-chat-controls">
          <button
            onClick={handleSend}
            disabled={!input.trim() || enabledChats.length < 2 || isSending}
          >
            {isSending ? 'Отправка...' : (
              mode === 'normal' ? 'Отправить всем' :
              mode === 'collaborative' ? 'Начать обсуждение' :
              'Запустить координацию'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlobalChat;
