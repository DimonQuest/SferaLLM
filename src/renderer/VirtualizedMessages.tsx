import React, { useRef, useEffect, useState } from 'react';
import { Message } from '../types';

interface VirtualizedMessagesProps {
  messages: Message[];
  renderMessage: (message: Message, index: number) => React.ReactNode;
  itemHeight?: number;
  overscan?: number;
}

const VirtualizedMessages: React.FC<VirtualizedMessagesProps> = ({
  messages,
  renderMessage,
  itemHeight = 100,
  overscan = 3
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };

    const handleResize = () => {
      setContainerHeight(container.clientHeight);
    };

    container.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);

    // Инициализация
    setContainerHeight(container.clientHeight);
    setScrollTop(container.scrollTop);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Автоскролл к последнему сообщению
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;

    if (isNearBottom) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages.length]);

  const totalHeight = messages.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    messages.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleMessages = messages.slice(startIndex, endIndex + 1);
  const offsetY = startIndex * itemHeight;

  return (
    <div
      ref={containerRef}
      style={{
        height: '100%',
        overflow: 'auto',
        position: 'relative'
      }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleMessages.map((message, index) => (
            <div key={message.id}>
              {renderMessage(message, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VirtualizedMessages;
