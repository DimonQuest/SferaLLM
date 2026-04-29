# Инструкции по сборке SferaLLM

## Текущий статус

Все улучшения реализованы. Ошибки из `error.txt` устарели - файлы `autoUpdater.ts` и `sessionManager.ts` больше не существуют в проекте.

## Исправленные проблемы

1. ✅ **App.tsx** - Заменен `window.require('electron')` на `window.electronAPI`
2. ✅ **main.ts** - Использует только существующие модули
3. ✅ **preload.ts** - Создан безопасный IPC bridge

## Сборка проекта

### Требования
- Node.js 18+ 
- npm 9+

### Команды

```bash
# Перейти в директорию проекта
cd "D:\ii\omniroute\SferaLLM-Production\SferaLLM"

# Установить зависимости
npm install

# Компиляция TypeScript
npx tsc

# Сборка webpack
npx webpack --mode production

# Копирование preload.js (если нужно)
copy src\main\preload.js dist\main\preload.js

# Или все вместе
npm run build

# Запуск
npm start

# Создание установщика
npm run dist
```

## Возможные проблемы

### 1. Ошибка "npm: command not found"
**Решение:** Установите Node.js с https://nodejs.org/

### 2. Ошибки TypeScript компиляции
**Решение:** Убедитесь, что все файлы из INTEGRATION-GUIDE.md интегрированы

### 3. Ошибка "Cannot find module 'electron'"
**Решение:** 
```bash
npm install electron --save-dev
```

### 4. Ошибки webpack
**Решение:**
```bash
npm install webpack webpack-cli --save-dev
```

## Проверка после сборки

1. Проверьте, что `dist/main/main.js` создан
2. Проверьте, что `dist/main/preload.js` создан
3. Проверьте, что `dist/renderer/` содержит HTML и JS файлы

## Следующие шаги

1. Установите Node.js, если еще не установлен
2. Запустите `npm install`
3. Запустите `npm run build`
4. Проверьте вывод на наличие ошибок
5. Если есть ошибки - сообщите мне

## Примечание

Файл `error.txt` содержит устаревшие ошибки. После моих изменений:
- Удалены ссылки на несуществующие файлы
- Исправлен App.tsx для использования безопасного API
- Все новые утилиты готовы к использованию
