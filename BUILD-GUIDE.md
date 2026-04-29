# Сборка Multi-Model-Chat-v2 для продакшна

## Предварительные требования

1. **Node.js** - версия 18.x или выше
2. **npm** - версия 9.x или выше
3. **Git** (опционально)

Проверьте установку:
```bash
node --version
npm --version
```

## Шаг 1: Установка зависимостей

Откройте терминал в папке проекта:

```bash
cd "D:\ii\omniroute\Multi-Model-Chat-v2"
npm install
```

Это установит все необходимые пакеты из `package.json`.

## Шаг 2: Сборка приложения

### Для Windows (рекомендуется):

```bash
npm run dist:win
```

Это создаст:
- **NSIS установщик** (.exe) - для установки на компьютер
- **Portable версию** (.exe) - запуск без установки

### Для других платформ:

```bash
# macOS
npm run dist:mac

# Linux
npm run dist:linux

# Все платформы сразу
npm run dist
```

## Шаг 3: Найти собранные файлы

После успешной сборки файлы будут в папке:
```
D:\ii\omniroute\Multi-Model-Chat-v2\release\
```

Структура:
```
release/
├── Multi-Model LLM Chat Setup 2.0.0.exe    # Установщик
├── Multi-Model LLM Chat 2.0.0.exe          # Portable версия
└── win-unpacked/                            # Распакованная версия
```

## Оптимизация для продакшна

### 1. Обновите webpack.config.js для production:

```javascript
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    mode: isProduction ? 'production' : 'development',
    entry: './src/renderer/index.tsx',
    target: 'electron-renderer',
    devtool: isProduction ? false : 'source-map',
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        }
      ]
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.jsx']
    },
    output: {
      filename: 'renderer.js',
      path: path.resolve(__dirname, 'dist/renderer')
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './public/index.html',
        minify: isProduction ? {
          removeComments: true,
          collapseWhitespace: true,
          removeRedundantAttributes: true,
          useShortDoctype: true,
          removeEmptyAttributes: true,
          removeStyleLinkTypeAttributes: true,
          keepClosingSlash: true,
          minifyJS: true,
          minifyCSS: true,
          minifyURLs: true
        } : false
      })
    ],
    optimization: isProduction ? {
      minimize: true,
      splitChunks: {
        chunks: 'all'
      }
    } : {}
  };
};
```

### 2. Обновите package.json scripts:

```json
"scripts": {
  "build": "tsc && webpack --mode production && copy src\\main\\preload.js dist\\main\\preload.js",
  "build:main": "tsc",
  "build:renderer": "webpack --mode production",
  "start": "npm run build && npx electron .",
  "dev": "tsc && webpack --mode development && npx electron .",
  "pack": "electron-builder --dir",
  "dist": "npm run build && electron-builder",
  "dist:win": "npm run build && electron-builder --win",
  "dist:mac": "npm run build && electron-builder --mac",
  "dist:linux": "npm run build && electron-builder --linux"
}
```

### 3. Добавьте иконки приложения:

Создайте иконки в папке `public/`:
- `icon.ico` - для Windows (256x256)
- `icon.icns` - для macOS
- `icon.png` - для Linux (512x512)

Можно использовать онлайн конвертер: https://www.icoconverter.com/

## Проверка перед релизом

### 1. Тестирование сборки:

```bash
# Сборка без упаковки (быстрее)
npm run pack

# Запуск из папки release/win-unpacked/
cd release/win-unpacked
"Multi-Model LLM Chat.exe"
```

### 2. Проверьте:
- ✅ Все чаты работают
- ✅ API ключи сохраняются
- ✅ Экспорт/импорт функционирует
- ✅ Темы применяются
- ✅ Горячие клавиши работают
- ✅ Нет ошибок в консоли

### 3. Размер приложения:

Ожидаемый размер:
- Установщик: ~80-120 MB
- Portable: ~150-200 MB
- Распакованная: ~200-250 MB

## Подписание приложения (опционально)

Для Windows нужен сертификат кода:

```json
// В package.json добавьте:
"build": {
  "win": {
    "certificateFile": "path/to/certificate.pfx",
    "certificatePassword": "your-password",
    "signingHashAlgorithms": ["sha256"],
    "sign": "./sign.js"
  }
}
```

## Автоматическое обновление

Для включения auto-update добавьте в `src/main/main.ts`:

```typescript
import { autoUpdater } from 'electron-updater';

// После создания окна
autoUpdater.checkForUpdatesAndNotify();

autoUpdater.on('update-available', () => {
  console.log('Update available');
});

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall();
});
```

И в `package.json`:

```json
"build": {
  "publish": {
    "provider": "github",
    "owner": "your-username",
    "repo": "multi-model-chat"
  }
}
```

## Распространение

### Вариант 1: GitHub Releases
1. Создайте релиз на GitHub
2. Загрузите `.exe` файлы
3. Пользователи скачивают напрямую

### Вариант 2: Собственный сервер
1. Загрузите файлы на свой сервер
2. Создайте страницу загрузки
3. Настройте auto-update на ваш сервер

### Вариант 3: Microsoft Store / Mac App Store
Требует регистрации разработчика и дополнительной настройки.

## Устранение проблем

### Ошибка: "Cannot find module 'electron'"
```bash
npm install --save-dev electron
```

### Ошибка: "tsc not found"
```bash
npm install --save-dev typescript
```

### Ошибка при сборке на Windows
Запустите PowerShell от администратора:
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Большой размер приложения
Добавьте в `package.json`:
```json
"build": {
  "asar": true,
  "compression": "maximum",
  "files": [
    "dist/**/*",
    "public/**/*",
    "!**/*.map"
  ]
}
```

## Быстрая команда для полной сборки

```bash
# Очистка + установка + сборка
rm -rf node_modules dist release && npm install && npm run dist:win
```

Или для Windows PowerShell:
```powershell
Remove-Item -Recurse -Force node_modules,dist,release -ErrorAction SilentlyContinue; npm install; npm run dist:win
```

## Результат

После выполнения всех шагов у вас будет:
- ✅ Готовый установщик для Windows
- ✅ Portable версия (не требует установки)
- ✅ Оптимизированный код
- ✅ Минимальный размер
- ✅ Готово к распространению

Время сборки: ~2-5 минут в зависимости от компьютера.
