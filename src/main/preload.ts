import { contextBridge, ipcRenderer } from 'electron';

// Безопасный API для renderer процесса
contextBridge.exposeInMainWorld('electronAPI', {
  // IPC события
  on: (channel: string, callback: (...args: any[]) => void) => {
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
      const listener = (_event: any, ...args: any[]) => callback(...args);
      ipcRenderer.on(channel, listener);
    }
  },

  removeListener: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.removeAllListeners(channel);
  },

  // Безопасное хранилище для API ключей
  secureStorage: {
    setKey: (key: string, value: string) => ipcRenderer.invoke('secure-storage-set', key, value),
    getKey: (key: string) => ipcRenderer.invoke('secure-storage-get', key),
    deleteKey: (key: string) => ipcRenderer.invoke('secure-storage-delete', key),
    hasKey: (key: string) => ipcRenderer.invoke('secure-storage-has', key)
  },

  // Файловые операции
  file: {
    saveDialog: (options: any) => ipcRenderer.invoke('file-save-dialog', options),
    openDialog: (options: any) => ipcRenderer.invoke('file-open-dialog', options),
    writeFile: (path: string, data: string) => ipcRenderer.invoke('file-write', path, data),
    readFile: (path: string) => ipcRenderer.invoke('file-read', path)
  },

  // Файловая система для AI инструментов
  fs: {
    listDirectory: (path: string) => ipcRenderer.invoke('fs-list-directory', path),
    executeCommand: (command: string, cwd?: string) => ipcRenderer.invoke('fs-execute-command', command, cwd),
    searchFiles: (path: string, pattern: string) => ipcRenderer.invoke('fs-search-files', path, pattern),
    createDirectory: (path: string) => ipcRenderer.invoke('fs-create-directory', path),
    deleteFile: (path: string) => ipcRenderer.invoke('fs-delete-file', path),
    getStats: (path: string) => ipcRenderer.invoke('fs-get-stats', path)
  },

  // Уведомления
  notification: {
    show: (title: string, body: string) => ipcRenderer.invoke('show-notification', title, body)
  },

  // Информация о приложении
  app: {
    getVersion: () => ipcRenderer.invoke('app-get-version'),
    checkForUpdates: () => ipcRenderer.invoke('app-check-updates')
  },

  // Прокси
  proxy: {
    setProxy: (config: { host: string; port: number; username?: string; password?: string }) =>
      ipcRenderer.invoke('set-proxy', config),
    clearProxy: () => ipcRenderer.invoke('clear-proxy')
  }
});
