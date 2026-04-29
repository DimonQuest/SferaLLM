const { contextBridge, ipcRenderer } = require('electron');

// Безопасный API для renderer процесса
contextBridge.exposeInMainWorld('electronAPI', {
  // IPC события
  on: (channel, callback) => {
    const validChannels = [
      'change-layout',
      'toggle-sidebar',
      'open-settings',
      'toggle-global-chat',
      'open-prompt-templates',
      'open-export-import',
      'open-analytics',
      'open-search-history',
      'open-compare-responses',
      'clear-all-chats',
      'switch-chat',
      'new-chat'
    ];
    if (validChannels.includes(channel)) {
      const listener = (_event, ...args) => callback(...args);
      ipcRenderer.on(channel, listener);
    }
  },

  removeListener: (channel, callback) => {
    ipcRenderer.removeAllListeners(channel);
  },

  // Безопасное хранилище для API ключей
  secureStorage: {
    setKey: (key, value) => ipcRenderer.invoke('secure-storage-set', key, value),
    getKey: (key) => ipcRenderer.invoke('secure-storage-get', key),
    deleteKey: (key) => ipcRenderer.invoke('secure-storage-delete', key),
    hasKey: (key) => ipcRenderer.invoke('secure-storage-has', key)
  },

  // Файловые операции
  file: {
    saveDialog: (options) => ipcRenderer.invoke('file-save-dialog', options),
    openDialog: (options) => ipcRenderer.invoke('file-open-dialog', options),
    writeFile: (path, data) => ipcRenderer.invoke('file-write', path, data),
    readFile: (path) => ipcRenderer.invoke('file-read', path)
  },

  // Файловая система для AI инструментов
  fs: {
    listDirectory: (path) => ipcRenderer.invoke('fs-list-directory', path),
    executeCommand: (command, cwd) => ipcRenderer.invoke('fs-execute-command', command, cwd),
    searchFiles: (path, pattern) => ipcRenderer.invoke('fs-search-files', path, pattern),
    createDirectory: (path) => ipcRenderer.invoke('fs-create-directory', path),
    deleteFile: (path) => ipcRenderer.invoke('fs-delete-file', path),
    getStats: (path) => ipcRenderer.invoke('fs-get-stats', path)
  },

  // Уведомления
  notification: {
    show: (title, body) => ipcRenderer.invoke('show-notification', title, body)
  },

  // Информация о приложении
  app: {
    getVersion: () => ipcRenderer.invoke('app-get-version'),
    checkForUpdates: () => ipcRenderer.invoke('app-check-updates')
  }
});

console.log('Preload script loaded, electronAPI exposed');
