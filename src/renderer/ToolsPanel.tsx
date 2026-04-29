import React, { useState, useEffect } from 'react';
import { PermissionManager, Permission } from '../utils/permissionManager';
import './ToolsPanel.css';

interface ToolsPanelProps {
  chatId: string;
  onClose: () => void;
}

const ToolsPanel: React.FC<ToolsPanelProps> = ({ chatId, onClose }) => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    loadPermissions();
  }, [chatId]);

  const loadPermissions = () => {
    const perms = PermissionManager.getPermissions(chatId);
    setPermissions(perms);
  };

  const revokePermission = (type: string) => {
    if (confirm(`Отозвать разрешение "${type}"?`)) {
      PermissionManager.revokePermission(chatId, type as any);
      loadPermissions();
    }
  };

  const revokeAll = () => {
    if (confirm('Отозвать все разрешения для этого чата?')) {
      PermissionManager.revokeAllPermissions(chatId);
      loadPermissions();
    }
  };

  const permissionLabels: Record<string, string> = {
    'read-file': '📄 Чтение файлов',
    'write-file': '✏️ Запись файлов',
    'edit-file': '📝 Редактирование файлов',
    'delete-file': '🗑️ Удаление файлов',
    'list-directory': '📁 Просмотр папок',
    'execute-command': '💻 Выполнение команд',
    'create-directory': '📂 Создание папок',
    'search-files': '🔍 Поиск файлов'
  };

  return (
    <div className="tools-panel-overlay" onClick={onClose}>
      <div className="tools-panel" onClick={(e) => e.stopPropagation()}>
        <div className="tools-panel-header">
          <h2>🛠️ Инструменты AI</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="tools-panel-content">
          {/* Информация */}
          <div className="tools-info">
            <p>
              AI может работать с вашей файловой системой, как Claude Code.
              Для каждого действия будет запрашиваться разрешение.
            </p>
            <button
              className="help-toggle"
              onClick={() => setShowHelp(!showHelp)}
            >
              {showHelp ? '▼' : '▶'} Доступные инструменты
            </button>
          </div>

          {/* Список инструментов */}
          {showHelp && (
            <div className="tools-list">
              <div className="tool-item">
                <span className="tool-icon">📄</span>
                <div className="tool-info">
                  <strong>read_file</strong>
                  <p>Читает содержимое файла</p>
                </div>
              </div>
              <div className="tool-item">
                <span className="tool-icon">✏️</span>
                <div className="tool-info">
                  <strong>write_file</strong>
                  <p>Записывает содержимое в файл</p>
                </div>
              </div>
              <div className="tool-item">
                <span className="tool-icon">📝</span>
                <div className="tool-info">
                  <strong>edit_file</strong>
                  <p>Редактирует файл (замена текста)</p>
                </div>
              </div>
              <div className="tool-item">
                <span className="tool-icon">📁</span>
                <div className="tool-info">
                  <strong>list_directory</strong>
                  <p>Показывает содержимое папки</p>
                </div>
              </div>
              <div className="tool-item">
                <span className="tool-icon">💻</span>
                <div className="tool-info">
                  <strong>execute_command</strong>
                  <p>Выполняет команду в терминале</p>
                </div>
              </div>
              <div className="tool-item">
                <span className="tool-icon">🔍</span>
                <div className="tool-info">
                  <strong>search_files</strong>
                  <p>Ищет файлы по паттерну</p>
                </div>
              </div>
              <div className="tool-item">
                <span className="tool-icon">📂</span>
                <div className="tool-info">
                  <strong>create_directory</strong>
                  <p>Создает новую папку</p>
                </div>
              </div>
            </div>
          )}

          {/* Активные разрешения */}
          <div className="permissions-section">
            <div className="section-header">
              <h3>Активные разрешения</h3>
              {permissions.length > 0 && (
                <button className="revoke-all-btn" onClick={revokeAll}>
                  Отозвать все
                </button>
              )}
            </div>

            {permissions.length === 0 ? (
              <div className="no-permissions">
                <p>Нет активных разрешений</p>
                <p className="hint">
                  Разрешения будут запрашиваться автоматически, когда AI попытается
                  использовать инструменты
                </p>
              </div>
            ) : (
              <div className="permissions-list">
                {permissions.map((perm, index) => (
                  <div key={index} className="permission-item">
                    <div className="permission-info">
                      <span className="permission-label">
                        {permissionLabels[perm.type] || perm.type}
                      </span>
                      {perm.path && (
                        <span className="permission-path">{perm.path}</span>
                      )}
                      <span className="permission-time">
                        {new Date(perm.timestamp).toLocaleString('ru-RU')}
                      </span>
                    </div>
                    <button
                      className="revoke-btn"
                      onClick={() => revokePermission(perm.type)}
                    >
                      Отозвать
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Примеры использования */}
          <div className="examples-section">
            <h3>💡 Примеры запросов</h3>
            <div className="example-item">
              <code>"Прочитай файл package.json"</code>
            </div>
            <div className="example-item">
              <code>"Создай файл README.md с описанием проекта"</code>
            </div>
            <div className="example-item">
              <code>"Покажи содержимое папки src"</code>
            </div>
            <div className="example-item">
              <code>"Выполни команду npm install"</code>
            </div>
            <div className="example-item">
              <code>"Найди все файлы .ts в проекте"</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolsPanel;
