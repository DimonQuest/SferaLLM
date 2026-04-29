export interface ChatConfig {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'mistral' | 'openrouter' | 'omniroute' | 'custom' | 'cohere' | 'perplexity' | 'groq' | 'xai' | 'deepseek' | '9route';
  model: string;
  apiKey: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  proxyMode?: 'none' | 'auto' | 'manual';
  proxyCountry?: string;
  proxyHost?: string;
  proxyPort?: number;
  proxyUsername?: string;
  proxyPassword?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  tokens?: number;
  bookmarked?: boolean;
  versions?: MessageVersion[];
  currentVersionIndex?: number;
}

export interface MessageVersion {
  id: string;
  content: string;
  timestamp: number;
  tokens?: number;
}

export interface Chat {
  id: string;
  config: ChatConfig;
  messages: Message[];
  isActive: boolean;
  enabled: boolean;
  tokensUsed: number;
  tokenLimit?: number;
  isMaximized?: boolean;
  responseLength?: 'short' | 'standard' | 'detailed';
}

export interface ElectronAPI {
  on: (channel: string, callback: (...args: any[]) => void) => void;
  removeListener: (channel: string, callback: (...args: any[]) => void) => void;
  secureStorage: {
    setKey: (key: string, value: string) => Promise<void>;
    getKey: (key: string) => Promise<string | null>;
    deleteKey: (key: string) => Promise<void>;
    hasKey: (key: string) => Promise<boolean>;
  };
  file: {
    saveDialog: (options: any) => Promise<string | undefined>;
    openDialog: (options: any) => Promise<string[] | undefined>;
    writeFile: (path: string, data: string) => Promise<void>;
    readFile: (path: string) => Promise<string>;
  };
  fs: {
    listDirectory: (path: string) => Promise<Array<{ name: string; isDirectory: boolean }>>;
    executeCommand: (command: string, cwd?: string) => Promise<string>;
    searchFiles: (path: string, pattern: string) => Promise<string[]>;
    createDirectory: (path: string) => Promise<void>;
    deleteFile: (path: string) => Promise<void>;
    getStats: (path: string) => Promise<any>;
  };
  notification: {
    show: (title: string, body: string) => Promise<void>;
  };
  app: {
    getVersion: () => Promise<string>;
    checkForUpdates: () => Promise<any>;
  };
  proxy: {
    setProxy: (config: { host: string; port: number; username?: string; password?: string }) => Promise<{ success: boolean; error?: string }>;
    clearProxy: () => Promise<{ success: boolean; error?: string }>;
  };
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
