import React, { useState, useEffect } from 'react';
import { pluginManager, AnyPlugin } from '../types/plugin';
import './PluginManager.css';

interface PluginManagerProps {
  onClose: () => void;
}

const PluginManager: React.FC<PluginManagerProps> = ({ onClose }) => {
  const [plugins, setPlugins] = useState<AnyPlugin[]>([]);
  const [selectedPlugin, setSelectedPlugin] = useState<AnyPlugin | null>(null);
  const [showInstallForm, setShowInstallForm] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'provider' | 'ui' | 'middleware' | 'tool'>('all');

  useEffect(() => {
    loadPlugins();
  }, []);

  const loadPlugins = () => {
    setPlugins(pluginManager.getAllPlugins());
  };

  const filteredPlugins = filterType === 'all'
    ? plugins
    : plugins.filter(p => p.type === filterType);

  const handleTogglePlugin = async (pluginId: string, enabled: boolean) => {
    try {
      if (enabled) {
        await pluginManager.enablePlugin(pluginId);
      } else {
        pluginManager.disablePlugin(pluginId);
      }
      loadPlugins();
    } catch (error) {
      alert('Ошибка: ' + (error as Error).message);
    }
  };

  const handleUninstall = (pluginId: string) => {
    if (confirm('Удалить этот плагин?')) {
      pluginManager.uninstallPlugin(pluginId);
      loadPlugins();
      setSelectedPlugin(null);
    }
  };

  const handleInstallFromJSON = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const pluginData = JSON.parse(text);
        await pluginManager.installPlugin(pluginData);
        loadPlugins();
        setShowInstallForm(false);
        alert(`Плагин "${pluginData.name}" успешно установлен!`);
      } catch (error) {
        alert('Ошибка установки: ' + (error as Error).message);
      }
    };
    input.click();
  };

  const getPluginTypeIcon = (type: string) => {
    switch (type) {
      case 'provider': return '🔌';
      case 'ui': return '🎨';
      case 'middleware': return '⚙️';
      case 'tool': return '🔧';
      default: return '📦';
    }
  };

  const getPluginTypeName = (type: string) => {
    switch (type) {
      case 'provider': return 'Провайдер';
      case 'ui': return 'UI компонент';
      case 'middleware': return 'Middleware';
      case 'tool': return 'Инструмент';
      default: return 'Неизвестно';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="plugin-manager-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🔌 Управление плагинами</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="plugin-manager-content">
          <div className="plugin-toolbar">
            <div className="filter-buttons">
              <button
                className={filterType === 'all' ? 'active' : ''}
                onClick={() => setFilterType('all')}
              >
                Все ({plugins.length})
              </button>
              <button
                className={filterType === 'provider' ? 'active' : ''}
                onClick={() => setFilterType('provider')}
              >
                🔌 Провайдеры
              </button>
              <button
                className={filterType === 'ui' ? 'active' : ''}
                onClick={() => setFilterType('ui')}
              >
                🎨 UI
              </button>
              <button
                className={filterType === 'middleware' ? 'active' : ''}
                onClick={() => setFilterType('middleware')}
              >
                ⚙️ Middleware
              </button>
              <button
                className={filterType === 'tool' ? 'active' : ''}
                onClick={() => setFilterType('tool')}
              >
                🔧 Инструменты
              </button>
            </div>
            <button className="install-btn" onClick={handleInstallFromJSON}>
              + Установить плагин
            </button>
          </div>

          {filteredPlugins.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <h3>Нет установленных плагинов</h3>
              <p>Установите плагины для расширения функциональности приложения</p>
              <button onClick={handleInstallFromJSON}>Установить первый плагин</button>
            </div>
          ) : (
            <div className="plugins-layout">
              <div className="plugins-list">
                {filteredPlugins.map(plugin => (
                  <div
                    key={plugin.id}
                    className={`plugin-item ${selectedPlugin?.id === plugin.id ? 'selected' : ''} ${plugin.enabled ? 'enabled' : 'disabled'}`}
                    onClick={() => setSelectedPlugin(plugin)}
                  >
                    <div className="plugin-icon">{getPluginTypeIcon(plugin.type)}</div>
                    <div className="plugin-info">
                      <h4>{plugin.name}</h4>
                      <p>{getPluginTypeName(plugin.type)} • v{plugin.version}</p>
                    </div>
                    <label className="toggle-switch" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={plugin.enabled}
                        onChange={(e) => handleTogglePlugin(plugin.id, e.target.checked)}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                ))}
              </div>

              {selectedPlugin && (
                <div className="plugin-details">
                  <div className="details-header">
                    <div className="plugin-title">
                      <span className="plugin-icon-large">{getPluginTypeIcon(selectedPlugin.type)}</span>
                      <div>
                        <h3>{selectedPlugin.name}</h3>
                        <p className="plugin-version">Версия {selectedPlugin.version}</p>
                      </div>
                    </div>
                    <span className={`status-badge ${selectedPlugin.enabled ? 'enabled' : 'disabled'}`}>
                      {selectedPlugin.enabled ? '✓ Включен' : '○ Отключен'}
                    </span>
                  </div>

                  <div className="details-body">
                    <div className="detail-section">
                      <h4>Описание</h4>
                      <p>{selectedPlugin.description}</p>
                    </div>

                    <div className="detail-section">
                      <h4>Информация</h4>
                      <div className="info-grid">
                        <div className="info-item">
                          <span className="info-label">Автор:</span>
                          <span className="info-value">{selectedPlugin.author}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Тип:</span>
                          <span className="info-value">{getPluginTypeName(selectedPlugin.type)}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">ID:</span>
                          <span className="info-value">{selectedPlugin.id}</span>
                        </div>
                      </div>
                    </div>

                    {selectedPlugin.type === 'provider' && (selectedPlugin as any).providerConfig && (
                      <div className="detail-section">
                        <h4>Конфигурация провайдера</h4>
                        <div className="info-grid">
                          <div className="info-item">
                            <span className="info-label">API Endpoint:</span>
                            <span className="info-value">{(selectedPlugin as any).providerConfig.apiEndpoint}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Streaming:</span>
                            <span className="info-value">{(selectedPlugin as any).providerConfig.supportsStreaming ? 'Да' : 'Нет'}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Файлы:</span>
                            <span className="info-value">{(selectedPlugin as any).providerConfig.supportsFiles ? 'Да' : 'Нет'}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="details-footer">
                    <button
                      className="uninstall-btn"
                      onClick={() => handleUninstall(selectedPlugin.id)}
                    >
                      🗑️ Удалить плагин
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PluginManager;
