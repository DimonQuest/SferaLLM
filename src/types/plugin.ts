export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  enabled: boolean;
  type: 'provider' | 'ui' | 'middleware' | 'tool';
  main: string; // путь к главному файлу плагина
  config?: Record<string, any>;
}

export interface ProviderPlugin extends Plugin {
  type: 'provider';
  providerConfig: {
    name: string;
    apiEndpoint: string;
    authType: 'bearer' | 'apikey' | 'custom';
    models: string[];
    supportsStreaming: boolean;
    supportsFiles: boolean;
  };
}

export interface UIPlugin extends Plugin {
  type: 'ui';
  uiConfig: {
    location: 'sidebar' | 'toolbar' | 'settings' | 'chat-window';
    component: string;
  };
}

export interface MiddlewarePlugin extends Plugin {
  type: 'middleware';
  middlewareConfig: {
    hooks: ('before-send' | 'after-receive' | 'on-error')[];
    priority: number;
  };
}

export interface ToolPlugin extends Plugin {
  type: 'tool';
  toolConfig: {
    commands: {
      name: string;
      description: string;
      handler: string;
    }[];
  };
}

export type AnyPlugin = ProviderPlugin | UIPlugin | MiddlewarePlugin | ToolPlugin;

// Менеджер плагинов
export class PluginManager {
  private plugins: Map<string, AnyPlugin> = new Map();
  private pluginInstances: Map<string, any> = new Map();

  constructor() {
    this.loadPlugins();
  }

  private loadPlugins(): void {
    const savedPlugins = localStorage.getItem('installed-plugins');
    if (savedPlugins) {
      const plugins: AnyPlugin[] = JSON.parse(savedPlugins);
      plugins.forEach(plugin => {
        this.plugins.set(plugin.id, plugin);
      });
    }
  }

  private savePlugins(): void {
    const plugins = Array.from(this.plugins.values());
    localStorage.setItem('installed-plugins', JSON.stringify(plugins));
  }

  async installPlugin(pluginData: AnyPlugin): Promise<void> {
    // Валидация плагина
    if (!pluginData.id || !pluginData.name || !pluginData.version) {
      throw new Error('Неверный формат плагина');
    }

    // Проверка на дубликаты
    if (this.plugins.has(pluginData.id)) {
      throw new Error(`Плагин ${pluginData.id} уже установлен`);
    }

    // Добавление плагина
    this.plugins.set(pluginData.id, pluginData);
    this.savePlugins();

    // Если плагин включен, загружаем его
    if (pluginData.enabled) {
      await this.loadPlugin(pluginData.id);
    }
  }

  async loadPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Плагин ${pluginId} не найден`);
    }

    try {
      // В реальной реализации здесь будет динамическая загрузка модуля
      // const module = await import(plugin.main);
      // this.pluginInstances.set(pluginId, module.default);

      console.log(`Плагин ${plugin.name} загружен`);
    } catch (error) {
      console.error(`Ошибка загрузки плагина ${plugin.name}:`, error);
      throw error;
    }
  }

  unloadPlugin(pluginId: string): void {
    this.pluginInstances.delete(pluginId);
  }

  uninstallPlugin(pluginId: string): void {
    this.unloadPlugin(pluginId);
    this.plugins.delete(pluginId);
    this.savePlugins();
  }

  enablePlugin(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.enabled = true;
      this.savePlugins();
      this.loadPlugin(pluginId);
    }
  }

  disablePlugin(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.enabled = false;
      this.savePlugins();
      this.unloadPlugin(pluginId);
    }
  }

  getPlugin(pluginId: string): AnyPlugin | undefined {
    return this.plugins.get(pluginId);
  }

  getAllPlugins(): AnyPlugin[] {
    return Array.from(this.plugins.values());
  }

  getPluginsByType(type: Plugin['type']): AnyPlugin[] {
    return Array.from(this.plugins.values()).filter(p => p.type === type);
  }

  getEnabledPlugins(): AnyPlugin[] {
    return Array.from(this.plugins.values()).filter(p => p.enabled);
  }

  updatePluginConfig(pluginId: string, config: Record<string, any>): void {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.config = { ...plugin.config, ...config };
      this.savePlugins();
    }
  }
}

// Singleton instance
export const pluginManager = new PluginManager();
