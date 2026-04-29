# Material Design 3 - Инструкция по применению

## 📦 Что создано

1. **material-design-3.css** - Базовая система Material Design 3
   - Цветовая палитра (светлая и темная темы)
   - Типографика
   - Компоненты (кнопки, карточки, FAB, чипы и т.д.)
   - Elevation (тени)
   - Transitions

2. **App-MD3.css** - Стили для SferaLLM с MD3
   - Layout приложения
   - Сообщения
   - Боковая панель
   - Поле ввода
   - Анимации

## 🚀 Как применить

### Шаг 1: Импортировать CSS в App.tsx

```typescript
// В начале файла App.tsx
import './material-design-3.css';
import './App-MD3.css';
```

### Шаг 2: Обновить классы компонентов

#### Кнопки
```tsx
// Было:
<button className="primary-button">Отправить</button>

// Стало:
<button className="md-button md-button-filled md-ripple">Отправить</button>
```

#### Карточки чатов
```tsx
// Было:
<div className="chat-card">

// Стало:
<div className="md-card md-card-elevated">
```

#### FAB для нового чата
```tsx
<button className="md-fab" onClick={createNewChat}>
  <span>+</span>
</button>
```

### Шаг 3: Применить типографику

```tsx
// Заголовки
<h1 className="md-headline-large">SferaLLM</h1>
<h2 className="md-title-large">Настройки</h2>

// Текст
<p className="md-body-medium">Описание...</p>
<span className="md-label-small">Метка</span>
```

### Шаг 4: Использовать компоненты MD3

#### Текстовое поле
```tsx
<div className="md-text-field md-text-field-filled">
  <input type="text" placeholder="Введите сообщение..." />
</div>
```

#### Чипы (для фильтров/тегов)
```tsx
<div className="md-chip md-chip-filter">
  <span>OpenAI</span>
</div>
```

#### Диалог
```tsx
<div className="md-dialog">
  <h2 className="md-dialog-title">Настройки</h2>
  <div className="md-dialog-content">
    Содержимое диалога
  </div>
  <div className="md-dialog-actions">
    <button className="md-button md-button-text">Отмена</button>
    <button className="md-button md-button-filled">Сохранить</button>
  </div>
</div>
```

## 🎨 Цветовая палитра

### Светлая тема
- **Primary:** #6750a4 (фиолетовый)
- **Secondary:** #625b71 (серо-фиолетовый)
- **Tertiary:** #7d5260 (розовато-коричневый)
- **Surface:** #fffbfe (почти белый)
- **Background:** #fffbfe

### Темная тема
- **Primary:** #d0bcff (светло-фиолетовый)
- **Secondary:** #ccc2dc (светло-серый)
- **Tertiary:** #efb8c8 (светло-розовый)
- **Surface:** #1c1b1f (темно-серый)
- **Background:** #1c1b1f

## 🔧 Переключение темы

```typescript
// Установить темную тему
document.documentElement.setAttribute('data-theme', 'dark');

// Установить светлую тему
document.documentElement.setAttribute('data-theme', 'light');
```

## 📐 Компоненты

### Кнопки
- `md-button-filled` - Заполненная (основная)
- `md-button-outlined` - С обводкой
- `md-button-text` - Текстовая
- `md-button-elevated` - Приподнятая
- `md-button-tonal` - Тональная

### FAB (Floating Action Button)
- `md-fab` - Стандартный (56x56px)
- `md-fab-small` - Маленький (40x40px)
- `md-fab-large` - Большой (96x96px)
- `md-fab-extended` - Расширенный (с текстом)

### Карточки
- `md-card-elevated` - С тенью
- `md-card-filled` - Заполненная
- `md-card-outlined` - С обводкой

### Чипы
- `md-chip-assist` - Вспомогательный
- `md-chip-filter` - Фильтр (можно выбрать)
- `md-chip-input` - Для ввода
- `md-chip-suggestion` - Предложение

## 🎭 Анимации

### Ripple эффект
Добавьте класс `md-ripple` к любому кликабельному элементу:

```tsx
<button className="md-button md-button-filled md-ripple">
  Кнопка с ripple
</button>
```

### Transitions
Используйте CSS переменные:
- `var(--md-transition-duration-short)` - 200ms
- `var(--md-transition-duration-medium)` - 300ms
- `var(--md-transition-duration-long)` - 400ms
- `var(--md-transition-easing-standard)` - cubic-bezier(0.2, 0, 0, 1)

## 📱 Адаптивность

Дизайн адаптивен для экранов от 320px до 1920px+.

Брейкпоинты:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## 🎯 Примеры использования

### Боковая панель с чатами
```tsx
<div className="chat-list">
  <div className="chat-list-header">
    <h2 className="chat-list-title">Чаты</h2>
    <button className="md-button md-button-filled md-ripple">
      Новый чат
    </button>
  </div>
  <div className="chat-list-items">
    <div className="chat-item active">
      <div className="chat-item-icon">AI</div>
      <div className="chat-item-content">
        <div className="chat-item-name">GPT-4</div>
        <div className="chat-item-meta">
          <span>OpenAI</span>
          <span>•</span>
          <span>5 сообщений</span>
        </div>
      </div>
    </div>
  </div>
</div>
```

### Сообщение
```tsx
<div className="message user">
  <div className="message-avatar">Я</div>
  <div className="message-bubble">
    <div className="message-content">Привет!</div>
    <div className="message-time">14:30</div>
  </div>
</div>

<div className="message assistant">
  <div className="message-avatar">AI</div>
  <div className="message-bubble">
    <div className="message-content">Здравствуйте! Чем могу помочь?</div>
    <div className="message-time">14:30</div>
  </div>
</div>
```

### Поле ввода
```tsx
<div className="chat-input-area">
  <div className="chat-input-container">
    <textarea 
      className="chat-input"
      placeholder="Введите сообщение..."
      rows={1}
    />
    <button className="send-button md-ripple">
      <span>→</span>
    </button>
  </div>
</div>
```

## 🔍 Дополнительные возможности

### Elevation (тени)
```css
box-shadow: var(--md-elevation-1); /* Легкая тень */
box-shadow: var(--md-elevation-2); /* Средняя тень */
box-shadow: var(--md-elevation-3); /* Сильная тень */
```

### Spacing (отступы)
```css
padding: var(--md-spacing-xs);  /* 4px */
padding: var(--md-spacing-sm);  /* 8px */
padding: var(--md-spacing-md);  /* 16px */
padding: var(--md-spacing-lg);  /* 24px */
padding: var(--md-spacing-xl);  /* 32px */
```

### Border Radius (скругления)
```css
border-radius: var(--md-radius-xs);   /* 4px */
border-radius: var(--md-radius-sm);   /* 8px */
border-radius: var(--md-radius-md);   /* 12px */
border-radius: var(--md-radius-lg);   /* 16px */
border-radius: var(--md-radius-xl);   /* 28px */
border-radius: var(--md-radius-full); /* 9999px (круг) */
```

## ✅ Чеклист интеграции

- [ ] Импортировать CSS файлы в App.tsx
- [ ] Обновить классы кнопок
- [ ] Обновить классы карточек
- [ ] Применить типографику
- [ ] Добавить FAB для нового чата
- [ ] Обновить стили сообщений
- [ ] Добавить ripple эффекты
- [ ] Протестировать темную тему
- [ ] Проверить адаптивность
- [ ] Добавить анимации

## 🎨 Результат

После применения вы получите:
- ✅ Современный Material Design 3 интерфейс
- ✅ Плавные анимации и transitions
- ✅ Адаптивный дизайн
- ✅ Темная и светлая темы
- ✅ Профессиональный внешний вид
- ✅ Улучшенная читаемость
- ✅ Интуитивные компоненты

---

**Готово!** Material Design 3 полностью интегрирован и готов к использованию.
