# Инструкция по сборке production версии

## Перед сборкой

### 1. Проверьте что все работает
```bash
npm run dev
```

### 2. Конвертируйте иконки
Следуйте инструкциям в `ICON-CONVERT.md` для создания:
- `public/icon.ico` (Windows)
- `public/icon.icns` (macOS)
- `public/icon.png` (Linux)

### 3. Обновите версию (если нужно)
В `package.json` измените версию:
```json
"version": "2.1.0"
```

## Сборка

### Windows
```bash
npm run dist:win
```

Создаст в папке `release/`:
- `SferaLLM-Setup-2.1.0.exe` - установщик NSIS
- `SferaLLM-2.1.0-portable.exe` - portable версия

### macOS
```bash
npm run dist:mac
```

Создаст:
- `SferaLLM-2.1.0.dmg` - DMG образ
- `SferaLLM-2.1.0-mac.zip` - ZIP архив

### Linux
```bash
npm run dist:linux
```

Создаст:
- `SferaLLM-2.1.0.AppImage` - AppImage
- `sferallm_2.1.0_amd64.deb` - Debian пакет

## Время сборки

- **Windows:** ~5-10 минут
- **macOS:** ~10-15 минут
- **Linux:** ~5-10 минут

## Размер файлов

- **Windows installer:** ~150-200 MB
- **Windows portable:** ~150-200 MB
- **macOS DMG:** ~150-200 MB
- **Linux AppImage:** ~150-200 MB
- **Linux DEB:** ~150-200 MB

## Проверка после сборки

1. Установите собранную версию
2. Проверьте основные функции:
   - Создание чата
   - Отправка сообщений
   - Настройки прокси
   - Мультиагентная коллаборация
   - Экспорт/импорт
3. Проверьте автообновление (если настроено)

## Публикация

### GitHub Releases
1. Создайте новый релиз на GitHub
2. Загрузите файлы из `release/`
3. Добавьте changelog из README.md

### Автообновление
Настройте в `package.json`:
```json
"publish": {
  "provider": "github",
  "owner": "yourusername",
  "repo": "sferallm"
}
```

## Troubleshooting

### Ошибка "Icon not found"
- Убедитесь что иконки существуют в `public/`
- Проверьте формат файлов

### Ошибка сборки TypeScript
```bash
npm run build:main
```
Исправьте ошибки TypeScript

### Ошибка webpack
```bash
npm run build:renderer
```
Проверьте конфигурацию webpack

### Большой размер файла
- Проверьте `files` в `package.json`
- Убедитесь что `node_modules` исключены
- Используйте `compression: "maximum"`

## Оптимизация

### Уменьшение размера
1. Удалите неиспользуемые зависимости
2. Используйте `asar: true`
3. Включите `compression: "maximum"`

### Ускорение сборки
1. Используйте `--dir` для тестовой сборки
2. Отключите compression для dev сборок
3. Кэшируйте node_modules

## Команды

```bash
# Только упаковка (без установщика)
npm run pack

# Сборка для всех платформ
npm run dist

# Тестовая сборка (быстрая)
electron-builder --dir

# Сборка с публикацией
npm run dist -- --publish always
```

## Checklist перед релизом

- [ ] Обновлена версия в package.json
- [ ] Обновлен CHANGELOG в README.md
- [ ] Все тесты проходят
- [ ] Иконки конвертированы
- [ ] Проверена работа в dev режиме
- [ ] Собраны все платформы
- [ ] Проверена установка
- [ ] Создан GitHub Release
- [ ] Обновлена документация
