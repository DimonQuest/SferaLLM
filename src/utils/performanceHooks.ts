import { useMemo, useCallback, useRef, useEffect } from 'react';

// Debounce функция для оптимизации частых обновлений
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Throttle функция для ограничения частоты вызовов
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());

  return useCallback(
    ((...args) => {
      const now = Date.now();

      if (now - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = now;
      }
    }) as T,
    [callback, delay]
  );
}

// Мемоизация для предотвращения лишних рендеров
export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  return useCallback(callback, deps);
}

// Ленивая инициализация состояния
export function useLazyState<T>(
  initializer: () => T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = React.useState<T>(initializer);
  return [state, setState];
}

// Оптимизированный скролл
export function useVirtualScroll(
  itemCount: number,
  itemHeight: number,
  containerHeight: number,
  scrollTop: number
) {
  return useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      itemCount - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight)
    );

    return {
      startIndex: Math.max(0, startIndex - 2), // overscan
      endIndex: Math.min(itemCount - 1, endIndex + 2),
      offsetY: startIndex * itemHeight
    };
  }, [itemCount, itemHeight, containerHeight, scrollTop]);
}

// Intersection Observer для ленивой загрузки
export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options?: IntersectionObserverInit
) {
  const [isIntersecting, setIsIntersecting] = React.useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref, options]);

  return isIntersecting;
}

// Оптимизация для больших списков
export function useChunkedArray<T>(array: T[], chunkSize: number = 50) {
  return useMemo(() => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }, [array, chunkSize]);
}

// Кэширование вычислений
export function useMemoizedValue<T>(
  factory: () => T,
  deps: React.DependencyList
): T {
  return useMemo(factory, deps);
}

// Оптимизация для частых обновлений
export function useBatchedUpdates<T>(
  initialValue: T,
  batchDelay: number = 100
): [T, (value: T) => void] {
  const [value, setValue] = React.useState<T>(initialValue);
  const pendingValue = useRef<T>(initialValue);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const setBatchedValue = useCallback(
    (newValue: T) => {
      pendingValue.current = newValue;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setValue(pendingValue.current);
      }, batchDelay);
    },
    [batchDelay]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [value, setBatchedValue];
}

// Мониторинг производительности
export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0);
  const startTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current += 1;
    const renderTime = Date.now() - startTime.current;

    if (renderCount.current % 10 === 0) {
      console.log(`[Performance] ${componentName}: ${renderCount.current} renders, avg time: ${renderTime / renderCount.current}ms`);
    }
  });
}

// React import для useState
import React from 'react';
