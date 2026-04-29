# AI Инструменты для работы с файловой системой

## 🎯 Что реализовано

AI теперь может работать с вашей файловой системой, как **Claude Code**:
- 📄 Читать файлы
- ✏️ Записывать файлы
- 📝 Редактировать файлы
- 📁 Просматривать папки
- 💻 Выполнять команды
- 🔍 Искать файлы
- 📂 Создавать папки

**Все действия требуют разрешения пользователя!**

---

## 📦 Созданные файлы

### 1. Утилиты
- `src/utils/toolHandler.ts` - Обработчик инструментов AI
- `src/utils/permissionManager.ts` - Система разрешений

### 2. UI компоненты
- `src/renderer/ToolsPanel.tsx` - Панель управления инструментами
- `src/renderer/ToolsPanel.css` - Стили панели

### 3. Backend
- `src/main/main.ts` - IPC handlers для файловой системы
- `src/main/preload.js` - API для доступа к FS

---

## 🚀 Как использовать

### Шаг 1: Импортировать в App.tsx

```typescript
import { ToolHandler } from '../utils/toolHandler';
import ToolsPanel from './ToolsPanel';

// В состоянии
const [showToolsPanel, setShowToolsPanel] = useState(false);

// В JSX
{showToolsPanel && (
  <ToolsPanel
    chatId={activeChat}
    onClose={() => setShowToolsPanel(false)}
  />
)}
```

### Шаг 2: Добавить кнопку в интерфейс

```typescript
<button
  className="md-button md-button-outlined"
  onClick={() => setShowToolsPanel(true)}
>
  🛠️ Инструменты AI
</button>
```

### Шаг 3: Интегрировать с API запросами

При отправке сообщения AI, добавьте инструменты:

```typescript
const sendMessage = async (message: string) => {
  const tools = ToolHandler.getAvailableTools();

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      tools: tools, // Добавляем инструменты
      tool_choice: 'auto'
    })
  });

  const data = await response.json();

  // Если AI хочет использовать инструмент
  if (data.choices[0].message.tool_calls) {
    for (const toolCall of data.choices[0].message.tool_calls) {
      const result = await ToolHandler.executeTool({
        tool: toolCall.function.name,
        parameters: JSON.parse(toolCall.function.arguments),
        chatId: activeChat
      });

      // Отправляем результат обратно AI
      const formatted = ToolHandler.formatToolResult(
        toolCall.function.name,
        result
      );

      // Добавляем в историю сообщений
      addMessage({
        role: 'tool',
        content: formatted,
        tool_call_id: toolCall.id
      });
    }
  }
};
```

---

## 🔒 Система разрешений

### Как работает

1. AI пытается использовать инструмент
2. Система проверяет разрешения
3. Если разрешения нет - показывается диалог
4. Пользователь разрешает или отклоняет
5. Разрешение сохраняется для будущих запросов

### Управление разрешениями

```typescript
import { PermissionManager } from '../utils/permissionManager';

// Получить все разрешения для чата
const permissions = PermissionManager.getPermissions(chatId);

// Отозвать конкретное разрешение
PermissionManager.revokePermission(chatId, 'read-file');

// Отозвать все разрешения
PermissionManager.revokeAllPermissions(chatId);

// Проверить наличие разрешения
const hasPermission = PermissionManager.hasPermission(
  chatId,
  'read-file',
  '/path/to/file'
);
```

---

## 📋 Доступные инструменты

### 1. read_file
Читает содержимое файла

**Параметры:**
- `path` (string) - Путь к файлу

**Пример:**
```
"Прочитай файл package.json"
```

### 2. write_file
Записывает содержимое в файл

**Параметры:**
- `path` (string) - Путь к файлу
- `content` (string) - Содержимое

**Пример:**
```
"Создай файл README.md с описанием проекта"
```

### 3. edit_file
Редактирует файл (замена текста)

**Параметры:**
- `path` (string) - Путь к файлу
- `old_text` (string) - Текст для замены
- `new_text` (string) - Новый текст

**Пример:**
```
"Замени в файле App.tsx 'Hello' на 'Привет'"
```

### 4. list_directory
Показывает содержимое папки

**Параметры:**
- `path` (string) - Путь к папке

**Пример:**
```
"Покажи содержимое папки src"
```

### 5. execute_command
Выполняет команду в терминале

**Параметры:**
- `command` (string) - Команда
- `cwd` (string, optional) - Рабочая директория

**Пример:**
```
"Выполни команду npm install"
```

### 6. search_files
Ищет файлы по паттерну (glob)

**Параметры:**
- `path` (string) - Путь для поиска
- `pattern` (string) - Паттерн (например, "*.ts")

**Пример:**
```
"Найди все файлы .ts в проекте"
```

### 7. create_directory
Создает новую папку

**Параметры:**
- `path` (string) - Путь к новой папке

**Пример:**
```
"Создай папку src/components"
```

---

## 💡 Примеры использования

### Чтение и анализ кода
```
Пользователь: "Прочитай файл src/App.tsx и объясни, что он делает"

AI: [использует read_file]
📄 Файл прочитан:
```typescript
import React from 'react';
...
```

Этот файл является главным компонентом приложения...
```

### Создание файлов
```
Пользователь: "Создай компонент Button.tsx в папке src/components"

AI: [использует write_file]
✅ File written successfully

Создал компонент Button.tsx с базовой структурой.
```

### Выполнение команд
```
Пользователь: "Установи библиотеку axios"

AI: [использует execute_command]
💻 Результат:
```
added 5 packages in 2s
```

Библиотека axios успешно установлена.
```

### Поиск файлов
```
Пользователь: "Найди все компоненты React в проекте"

AI: [использует search_files с паттерном "**/*.tsx"]
📁 Найдено:
- src/App.tsx
- src/components/Button.tsx
- src/components/Input.tsx
```

---

## ⚙️ Настройка провайдеров

### OpenAI (GPT-4)
Поддерживает Function Calling из коробки.

```typescript
{
  model: "gpt-4",
  messages: [...],
  tools: tools,
  tool_choice: "auto"
}
```

### Anthropic (Claude)
Поддерживает Tool Use.

```typescript
{
  model: "claude-3-opus-20240229",
  messages: [...],
  tools: tools.map(t => ({
    name: t.name,
    description: t.description,
    input_schema: t.parameters
  }))
}
```

### Другие провайдеры
Проверьте документацию провайдера на поддержку Function Calling / Tool Use.

---

## 🔐 Безопасность

### Что защищено

1. **Все действия требуют разрешения**
   - Пользователь видит, что именно хочет сделать AI
   - Можно отклонить любое действие

2. **Разрешения привязаны к чату**
   - Каждый чат имеет свои разрешения
   - Разрешения не передаются между чатами

3. **Разрешения можно отозвать**
   - В любой момент через панель инструментов
   - Автоматически очищаются через 24 часа

4. **Sandbox режим**
   - Все операции выполняются через IPC
   - Нет прямого доступа к Node.js API

### Рекомендации

- ❌ Не давайте разрешения на системные папки
- ❌ Не разрешайте выполнение опасных команд (rm -rf, format и т.д.)
- ✅ Проверяйте пути перед разрешением
- ✅ Регулярно проверяйте активные разрешения
- ✅ Отзывайте неиспользуемые разрешения

---

## 🎨 UI интеграция

### Добавить кнопку в ChatWindow

```typescript
<div className="chat-header">
  <h3>{chat.config.name}</h3>
  <button
    className="md-button md-button-text"
    onClick={() => setShowToolsPanel(true)}
    title="Инструменты AI"
  >
    🛠️
  </button>
</div>
```

### Показать индикатор активных разрешений

```typescript
const permissions = PermissionManager.getPermissions(chatId);

{permissions.length > 0 && (
  <span className="permissions-badge">
    🔓 {permissions.length}
  </span>
)}
```

---

## 📊 Статистика использования

Добавьте трекинг использования инструментов:

```typescript
interface ToolUsageStats {
  tool: string;
  count: number;
  lastUsed: number;
}

// Сохранять при каждом использовании
const trackToolUsage = (tool: string) => {
  const stats = getToolStats();
  const existing = stats.find(s => s.tool === tool);
  
  if (existing) {
    existing.count++;
    existing.lastUsed = Date.now();
  } else {
    stats.push({
      tool,
      count: 1,
      lastUsed: Date.now()
    });
  }
  
  saveToolStats(stats);
};
```

---

## ✅ Чеклист интеграции

- [ ] Импортировать ToolHandler и PermissionManager
- [ ] Добавить ToolsPanel в App.tsx
- [ ] Добавить кнопку "Инструменты AI"
- [ ] Интегрировать с API запросами
- [ ] Добавить обработку tool_calls в ответах
- [ ] Протестировать каждый инструмент
- [ ] Проверить систему разрешений
- [ ] Добавить индикаторы в UI
- [ ] Настроить для всех провайдеров
- [ ] Документировать для пользователей

---

## 🎉 Готово!

AI теперь может работать с файловой системой, как Claude Code!

**Основные преимущества:**
- ✅ Полный контроль через разрешения
- ✅ Безопасное выполнение
- ✅ Удобный UI
- ✅ Совместимость с OpenAI, Anthropic и другими
- ✅ Расширяемая система инструментов

**Следующие шаги:**
1. Пересоберите проект: `npm run build`
2. Запустите: `npm start`
3. Попробуйте: "Прочитай файл package.json"
4. Разрешите доступ
5. Наслаждайтесь! 🚀
