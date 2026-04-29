import React, { useState } from 'react';
import { Theme, getAllThemes, applyTheme, saveCustomTheme, deleteCustomTheme } from '../types/theme';
import './ThemeManager.css';

interface ThemeManagerProps {
  currentThemeId: string;
  onThemeChange: (themeId: string) => void;
  onClose: () => void;
}

const ThemeManager: React.FC<ThemeManagerProps> = ({ currentThemeId, onThemeChange, onClose }) => {
  const [themes] = useState<Theme[]>(getAllThemes());
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleSelectTheme = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (theme) {
      applyTheme(theme);
      onThemeChange(themeId);
      localStorage.setItem('current-theme-id', themeId);
    }
  };

  const handleCreateTheme = () => {
    const newTheme: Theme = {
      id: `custom-${Date.now()}`,
      name: 'Новая тема',
      colors: {
        primary: '#3b82f6',
        primaryHover: '#2563eb',
        primaryLight: 'rgba(59, 130, 246, 0.1)',
        bgPrimary: '#1f2937',
        bgSecondary: '#111827',
        bgTertiary: '#374151',
        bgHover: '#4b5563',
        textPrimary: '#f9fafb',
        textSecondary: '#e5e7eb',
        textMuted: '#9ca3af',
        borderColor: '#374151',
        borderHover: '#4b5563',
        error: '#ef4444',
        success: '#10b981',
        warning: '#f59e0b'
      },
      fonts: {
        primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        code: '"Courier New", Consolas, Monaco, monospace'
      },
      spacing: {
        radiusSm: '4px',
        radiusMd: '8px',
        radiusLg: '12px'
      }
    };
    setEditingTheme(newTheme);
    setShowCreateForm(true);
  };

  const handleSaveTheme = () => {
    if (editingTheme) {
      saveCustomTheme(editingTheme);
      setEditingTheme(null);
      setShowCreateForm(false);
      window.location.reload(); // Перезагрузка для обновления списка тем
    }
  };

  const handleDeleteTheme = (themeId: string) => {
    if (confirm('Удалить эту тему?')) {
      deleteCustomTheme(themeId);
      window.location.reload();
    }
  };

  const updateThemeColor = (colorKey: string, value: string) => {
    if (editingTheme) {
      setEditingTheme({
        ...editingTheme,
        colors: {
          ...editingTheme.colors,
          [colorKey]: value
        }
      });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="theme-manager-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🎨 Управление темами</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="theme-manager-content">
          {!showCreateForm ? (
            <>
              <div className="themes-grid">
                {themes.map(theme => (
                  <div
                    key={theme.id}
                    className={`theme-card ${currentThemeId === theme.id ? 'active' : ''}`}
                    onClick={() => handleSelectTheme(theme.id)}
                  >
                    <div className="theme-preview">
                      <div className="preview-colors">
                        <div className="color-box" style={{ background: theme.colors.primary }}></div>
                        <div className="color-box" style={{ background: theme.colors.bgPrimary }}></div>
                        <div className="color-box" style={{ background: theme.colors.bgSecondary }}></div>
                        <div className="color-box" style={{ background: theme.colors.textPrimary }}></div>
                      </div>
                    </div>
                    <div className="theme-info">
                      <h3>{theme.name}</h3>
                      {currentThemeId === theme.id && <span className="active-badge">✓ Активна</span>}
                    </div>
                    {theme.id.startsWith('custom-') && (
                      <div className="theme-actions">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTheme(theme);
                            setShowCreateForm(true);
                          }}
                          title="Редактировать"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTheme(theme.id);
                          }}
                          title="Удалить"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button className="create-theme-btn" onClick={handleCreateTheme}>
                + Создать свою тему
              </button>
            </>
          ) : (
            <div className="theme-editor">
              <div className="editor-header">
                <input
                  type="text"
                  value={editingTheme?.name || ''}
                  onChange={(e) => setEditingTheme(editingTheme ? { ...editingTheme, name: e.target.value } : null)}
                  placeholder="Название темы"
                  className="theme-name-input"
                />
              </div>

              <div className="color-editor">
                <h3>Цвета</h3>
                <div className="color-inputs">
                  {editingTheme && Object.entries(editingTheme.colors).map(([key, value]) => (
                    <div key={key} className="color-input-group">
                      <label>{key}</label>
                      <div className="color-input-wrapper">
                        <input
                          type="color"
                          value={value.startsWith('rgba') ? '#3b82f6' : value}
                          onChange={(e) => updateThemeColor(key, e.target.value)}
                        />
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => updateThemeColor(key, e.target.value)}
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="editor-actions">
                <button onClick={handleSaveTheme} className="save-btn">
                  Сохранить тему
                </button>
                <button onClick={() => { setShowCreateForm(false); setEditingTheme(null); }} className="cancel-btn">
                  Отмена
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThemeManager;
