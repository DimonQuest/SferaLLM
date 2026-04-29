import { app, BrowserWindow, Menu, ipcMain, dialog, Notification, safeStorage } from 'electron';
import { autoUpdater } from 'electron-updater';
import * as path from 'path';
import * as fs from 'fs';
import { SecureStorage } from './secureStorage';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: true,
      webSecurity: true
    }
  });

  // CSP заголовки для безопасности
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline'; " +
          "style-src 'self' 'unsafe-inline'; " +
          "img-src 'self' data: https:; " +
          "connect-src 'self' https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com https://api.mistral.ai https://openrouter.ai https://api.cohere.ai https://api.perplexity.ai https://api.groq.com https://api.x.ai https://api.deepseek.com https://api.proxyscrape.com https://www.proxy-list.download https://api.ipify.org https://raw.githubusercontent.com http://localhost:* http://127.0.0.1:* http://192.168.0.136:* http://192.168.*:*; " +
          "font-src 'self' data:; " +
          "media-src 'self' blob:;"
        ]
      }
    });
  });

  // Разрешения для микрофона и медиа
  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowedPermissions = ['media', 'microphone', 'audioCapture'];
    if (allowedPermissions.includes(permission)) {
      callback(true);
    } else {
      callback(false);
    }
  });

  // Создаем меню приложения
  const menuTemplate: any[] = [
    {
      label: 'Файл',
      submenu: [
        { label: 'Новый чат', accelerator: 'CmdOrCtrl+N', click: () => mainWindow?.webContents.send('new-chat') },
        { type: 'separator' },
        { label: 'Экспорт / Импорт', accelerator: 'CmdOrCtrl+E', click: () => mainWindow?.webContents.send('open-export-import') },
        { label: 'Шаблоны промптов', accelerator: 'CmdOrCtrl+T', click: () => mainWindow?.webContents.send('open-prompt-templates') },
        { label: 'Настройки', accelerator: 'CmdOrCtrl+,', click: () => mainWindow?.webContents.send('open-settings') },
        { type: 'separator' },
        { label: 'Выход', role: 'quit' }
      ]
    },
    {
      label: 'Правка',
      submenu: [
        { label: 'Отменить', role: 'undo' },
        { label: 'Повторить', role: 'redo' },
        { type: 'separator' },
        { label: 'Вырезать', role: 'cut' },
        { label: 'Копировать', role: 'copy' },
        { label: 'Вставить', role: 'paste' },
        { label: 'Выделить все', role: 'selectAll' },
        { type: 'separator' },
        { label: 'Очистить все чаты', click: () => mainWindow?.webContents.send('clear-all-chats') }
      ]
    },
    {
      label: 'Вид',
      submenu: [
        { label: 'Перезагрузить', role: 'reload' },
        { label: 'Инструменты разработчика', role: 'toggleDevTools', accelerator: 'F12' },
        { type: 'separator' },
        { label: 'Поиск по истории', accelerator: 'CmdOrCtrl+F', click: () => mainWindow?.webContents.send('open-search-history') },
        { label: 'Сравнение ответов', accelerator: 'CmdOrCtrl+D', click: () => mainWindow?.webContents.send('open-compare-responses') },
        { label: 'Аналитика и статистика', accelerator: 'CmdOrCtrl+A', click: () => mainWindow?.webContents.send('open-analytics') },
        { type: 'separator' },
        { label: 'Увеличить', role: 'zoomIn' },
        { label: 'Уменьшить', role: 'zoomOut' },
        { label: 'Сбросить масштаб', role: 'resetZoom' }
      ]
    },
    {
      label: 'Чаты',
      submenu: [
        {
          label: 'Показать/Скрыть панель чатов',
          accelerator: 'CmdOrCtrl+B',
          click: () => mainWindow?.webContents.send('toggle-sidebar')
        },
        { type: 'separator' },
        { label: 'Чат 1', accelerator: 'CmdOrCtrl+1', click: () => mainWindow?.webContents.send('switch-chat', 0) },
        { label: 'Чат 2', accelerator: 'CmdOrCtrl+2', click: () => mainWindow?.webContents.send('switch-chat', 1) },
        { label: 'Чат 3', accelerator: 'CmdOrCtrl+3', click: () => mainWindow?.webContents.send('switch-chat', 2) },
        { label: 'Чат 4', accelerator: 'CmdOrCtrl+4', click: () => mainWindow?.webContents.send('switch-chat', 3) },
        { label: 'Чат 5', accelerator: 'CmdOrCtrl+5', click: () => mainWindow?.webContents.send('switch-chat', 4) },
        { label: 'Чат 6', accelerator: 'CmdOrCtrl+6', click: () => mainWindow?.webContents.send('switch-chat', 5) },
        { label: 'Чат 7', accelerator: 'CmdOrCtrl+7', click: () => mainWindow?.webContents.send('switch-chat', 6) },
        { label: 'Чат 8', accelerator: 'CmdOrCtrl+8', click: () => mainWindow?.webContents.send('switch-chat', 7) },
        { label: 'Чат 9', accelerator: 'CmdOrCtrl+9', click: () => mainWindow?.webContents.send('switch-chat', 8) }
      ]
    },
    {
      label: 'Расположение',
      submenu: [
        {
          label: '⬌ Горизонтально',
          click: () => mainWindow?.webContents.send('change-layout', 'horizontal')
        },
        {
          label: '⬍ Вертикально',
          click: () => mainWindow?.webContents.send('change-layout', 'vertical')
        },
        {
          label: '⊞ Сетка',
          click: () => mainWindow?.webContents.send('change-layout', 'grid')
        },
        {
          label: '⊡ Свободное',
          click: () => mainWindow?.webContents.send('change-layout', 'custom')
        }
      ]
    },
    {
      label: 'Общий чат',
      click: () => mainWindow?.webContents.send('toggle-global-chat')
    }
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  // Включаем контекстное меню с копированием/вставкой
  mainWindow.webContents.on('context-menu', (event, params) => {
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Вырезать', role: 'cut', enabled: params.editFlags.canCut },
      { label: 'Копировать', role: 'copy', enabled: params.editFlags.canCopy },
      { label: 'Вставить', role: 'paste', enabled: params.editFlags.canPaste },
      { type: 'separator' },
      { label: 'Выделить все', role: 'selectAll' }
    ]);
    contextMenu.popup();
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Настройка автообновлений
  setupAutoUpdater();
}

function setupAutoUpdater() {
  // Настройки автообновления
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  // Проверка обновлений при запуске
  autoUpdater.checkForUpdatesAndNotify();

  // Проверка каждые 4 часа
  setInterval(() => {
    autoUpdater.checkForUpdatesAndNotify();
  }, 4 * 60 * 60 * 1000);

  // События автообновления
  autoUpdater.on('checking-for-update', () => {
    console.log('Проверка обновлений...');
  });

  autoUpdater.on('update-available', (info) => {
    console.log('Доступно обновление:', info.version);
    if (mainWindow) {
      mainWindow.webContents.send('update-available', info);
    }
    if (Notification.isSupported()) {
      new Notification({
        title: 'Доступно обновление',
        body: `Версия ${info.version} загружается...`
      }).show();
    }
  });

  autoUpdater.on('update-not-available', () => {
    console.log('Обновлений нет');
  });

  autoUpdater.on('error', (err) => {
    console.error('Ошибка автообновления:', err);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    const message = `Загрузка: ${Math.round(progressObj.percent)}%`;
    console.log(message);
    if (mainWindow) {
      mainWindow.webContents.send('update-download-progress', progressObj);
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('Обновление загружено:', info.version);
    if (mainWindow) {
      mainWindow.webContents.send('update-downloaded', info);
    }
    if (Notification.isSupported()) {
      const notification = new Notification({
        title: 'Обновление готово',
        body: 'Перезапустите приложение для установки обновления'
      });
      notification.on('click', () => {
        autoUpdater.quitAndInstall();
      });
      notification.show();
    }
  });
}

// IPC Handlers для безопасного хранилища
ipcMain.handle('secure-storage-set', async (_event, key: string, value: string) => {
  try {
    const encrypted = SecureStorage.encryptString(value);
    // Сохраняем в electron-store или файл
    const storePath = path.join(app.getPath('userData'), 'secure-keys.json');
    let data: Record<string, string> = {};
    if (fs.existsSync(storePath)) {
      data = JSON.parse(fs.readFileSync(storePath, 'utf-8'));
    }
    data[key] = encrypted;
    fs.writeFileSync(storePath, JSON.stringify(data), 'utf-8');
  } catch (error) {
    console.error('Error saving secure key:', error);
    throw error;
  }
});

ipcMain.handle('secure-storage-get', async (_event, key: string) => {
  try {
    const storePath = path.join(app.getPath('userData'), 'secure-keys.json');
    if (!fs.existsSync(storePath)) return null;
    const data = JSON.parse(fs.readFileSync(storePath, 'utf-8'));
    if (!data[key]) return null;
    return SecureStorage.decryptString(data[key]);
  } catch (error) {
    console.error('Error reading secure key:', error);
    return null;
  }
});

ipcMain.handle('secure-storage-delete', async (_event, key: string) => {
  try {
    const storePath = path.join(app.getPath('userData'), 'secure-keys.json');
    if (!fs.existsSync(storePath)) return;
    const data = JSON.parse(fs.readFileSync(storePath, 'utf-8'));
    delete data[key];
    fs.writeFileSync(storePath, JSON.stringify(data), 'utf-8');
  } catch (error) {
    console.error('Error deleting secure key:', error);
  }
});

ipcMain.handle('secure-storage-has', async (_event, key: string) => {
  try {
    const storePath = path.join(app.getPath('userData'), 'secure-keys.json');
    if (!fs.existsSync(storePath)) return false;
    const data = JSON.parse(fs.readFileSync(storePath, 'utf-8'));
    return !!data[key];
  } catch (error) {
    return false;
  }
});

// Файловые операции
ipcMain.handle('file-save-dialog', async (_event, options) => {
  const result = await dialog.showSaveDialog(mainWindow!, options);
  return result.filePath;
});

ipcMain.handle('file-open-dialog', async (_event, options) => {
  const result = await dialog.showOpenDialog(mainWindow!, options);
  return result.filePaths;
});

ipcMain.handle('file-write', async (_event, filePath: string, data: string) => {
  fs.writeFileSync(filePath, data, 'utf-8');
});

ipcMain.handle('file-read', async (_event, filePath: string) => {
  return fs.readFileSync(filePath, 'utf-8');
});

// Уведомления
ipcMain.handle('show-notification', async (_event, title: string, body: string) => {
  if (Notification.isSupported()) {
    new Notification({ title, body }).show();
  }
});

// Настройка прокси
ipcMain.handle('set-proxy', async (_event, proxyConfig: { host: string; port: number; username?: string; password?: string }) => {
  try {
    if (!mainWindow) return { success: false, error: 'Window not available' };

    const proxyRules = `${proxyConfig.host}:${proxyConfig.port}`;
    const proxyBypassRules = 'localhost,127.0.0.1,<local>';

    await mainWindow.webContents.session.setProxy({
      proxyRules,
      proxyBypassRules
    });

    // Если есть авторизация, добавляем обработчик
    if (proxyConfig.username && proxyConfig.password) {
      app.on('login', (event, webContents, authenticationResponseDetails, authInfo, callback) => {
        if (authInfo.isProxy) {
          event.preventDefault();
          callback(proxyConfig.username!, proxyConfig.password!);
        }
      });
    }

    console.log(`Proxy configured: ${proxyRules}`);
    return { success: true };
  } catch (error) {
    console.error('Error setting proxy:', error);
    return { success: false, error: String(error) };
  }
});

// Сброс прокси
ipcMain.handle('clear-proxy', async () => {
  try {
    if (!mainWindow) return { success: false, error: 'Window not available' };

    await mainWindow.webContents.session.setProxy({
      proxyRules: '',
      proxyBypassRules: ''
    });

    console.log('Proxy cleared');
    return { success: true };
  } catch (error) {
    console.error('Error clearing proxy:', error);
    return { success: false, error: String(error) };
  }
});


// Информация о приложении
ipcMain.handle('app-get-version', async () => {
  return app.getVersion();
});

ipcMain.handle('app-check-updates', async () => {
  return autoUpdater.checkForUpdates();
});

// Файловая система для AI инструментов
ipcMain.handle('fs-list-directory', async (_event, dirPath: string) => {
  try {
    const files = fs.readdirSync(dirPath, { withFileTypes: true });
    return files.map(file => ({
      name: file.name,
      isDirectory: file.isDirectory(),
      isFile: file.isFile(),
      path: path.join(dirPath, file.name)
    }));
  } catch (error: any) {
    throw new Error(`Failed to list directory: ${error.message}`);
  }
});

ipcMain.handle('fs-execute-command', async (_event, command: string, cwd?: string) => {
  try {
    const { exec } = require('child_process');
    return new Promise((resolve, reject) => {
      exec(command, { cwd: cwd || process.cwd() }, (error: any, stdout: string, stderr: string) => {
        if (error) {
          reject(new Error(stderr || error.message));
        } else {
          resolve(stdout);
        }
      });
    });
  } catch (error: any) {
    throw new Error(`Failed to execute command: ${error.message}`);
  }
});

ipcMain.handle('fs-search-files', async (_event, dirPath: string, pattern: string) => {
  try {
    const glob = require('glob');
    return new Promise((resolve, reject) => {
      glob(pattern, { cwd: dirPath }, (error: any, files: string[]) => {
        if (error) {
          reject(error);
        } else {
          resolve(files);
        }
      });
    });
  } catch (error: any) {
    throw new Error(`Failed to search files: ${error.message}`);
  }
});

ipcMain.handle('fs-create-directory', async (_event, dirPath: string) => {
  try {
    fs.mkdirSync(dirPath, { recursive: true });
    return true;
  } catch (error: any) {
    throw new Error(`Failed to create directory: ${error.message}`);
  }
});

ipcMain.handle('fs-delete-file', async (_event, filePath: string) => {
  try {
    fs.unlinkSync(filePath);
    return true;
  } catch (error: any) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
});

ipcMain.handle('fs-get-stats', async (_event, filePath: string) => {
  try {
    const stats = fs.statSync(filePath);
    return {
      size: stats.size,
      isDirectory: stats.isDirectory(),
      isFile: stats.isFile(),
      created: stats.birthtime,
      modified: stats.mtime
    };
  } catch (error: any) {
    throw new Error(`Failed to get file stats: ${error.message}`);
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
