import React, { useState, useRef, useEffect } from 'react';
import { Chat, Message } from '../types';
import ChatWindow from './ChatWindow';
import './DraggableWindow.css';

interface DraggableWindowProps {
  chat: Chat;
  isActive: boolean;
  onUpdateMessages: (messages: Message[]) => void;
  onFocus: () => void;
}

const DraggableWindow: React.FC<DraggableWindowProps> = ({ chat, isActive, onUpdateMessages, onFocus }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 600, height: 700 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState('');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, posX: 0, posY: 0 });
  const [isInitialized, setIsInitialized] = useState(false);
  const windowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Загружаем сохраненную позицию и размер
    const saved = localStorage.getItem(`window-${chat.id}`);
    if (saved) {
      const { x, y, width, height } = JSON.parse(saved);
      setPosition({ x, y });
      setSize({ width, height });
    } else {
      // Случайная начальная позиция
      setPosition({
        x: Math.random() * 200,
        y: Math.random() * 100
      });
    }
    setIsInitialized(true);
  }, [chat.id]);

  useEffect(() => {
    // Сохраняем позицию и размер только после инициализации
    if (isInitialized) {
      localStorage.setItem(`window-${chat.id}`, JSON.stringify({
        x: position.x,
        y: position.y,
        width: size.width,
        height: size.height
      }));
    }
  }, [position, size, chat.id, isInitialized]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('draggable-header')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
      onFocus();
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
      posX: position.x,
      posY: position.y
    });
    onFocus();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        });
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;

        let newWidth = resizeStart.width;
        let newHeight = resizeStart.height;
        let newX = resizeStart.posX;
        let newY = resizeStart.posY;

        // Обработка изменения размера в зависимости от направления
        if (resizeDirection.includes('e')) {
          newWidth = Math.max(400, resizeStart.width + deltaX);
        }
        if (resizeDirection.includes('w')) {
          newWidth = Math.max(400, resizeStart.width - deltaX);
          if (newWidth > 400) newX = resizeStart.posX + deltaX;
        }
        if (resizeDirection.includes('s')) {
          newHeight = Math.max(300, resizeStart.height + deltaY);
        }
        if (resizeDirection.includes('n')) {
          newHeight = Math.max(300, resizeStart.height - deltaY);
          if (newHeight > 300) newY = resizeStart.posY + deltaY;
        }

        setSize({ width: newWidth, height: newHeight });
        setPosition({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeDirection('');
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, resizeStart, resizeDirection]);

  return (
    <div
      ref={windowRef}
      className={`draggable-window ${isActive ? 'active' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`
      }}
      onMouseDown={onFocus}
    >
      <div className="draggable-header" onMouseDown={handleMouseDown}>
        <span>{chat.config.name}</span>
        <span className="model-badge">{chat.config.model}</span>
      </div>
      <div className="draggable-content">
        <ChatWindow
          chat={chat}
          isActive={isActive}
          onUpdateMessages={onUpdateMessages}
        />
      </div>
      {/* Углы */}
      <div className="resize-handle nw" onMouseDown={(e) => handleResizeMouseDown(e, 'nw')} />
      <div className="resize-handle ne" onMouseDown={(e) => handleResizeMouseDown(e, 'ne')} />
      <div className="resize-handle sw" onMouseDown={(e) => handleResizeMouseDown(e, 'sw')} />
      <div className="resize-handle se" onMouseDown={(e) => handleResizeMouseDown(e, 'se')} />
      {/* Стороны */}
      <div className="resize-handle n" onMouseDown={(e) => handleResizeMouseDown(e, 'n')} />
      <div className="resize-handle s" onMouseDown={(e) => handleResizeMouseDown(e, 's')} />
      <div className="resize-handle w" onMouseDown={(e) => handleResizeMouseDown(e, 'w')} />
      <div className="resize-handle e" onMouseDown={(e) => handleResizeMouseDown(e, 'e')} />
    </div>
  );
};

export default DraggableWindow;
