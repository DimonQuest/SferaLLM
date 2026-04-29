import React, { useState, useEffect } from 'react';
import { AppSettings, defaultSettings } from '../types/settings';
import ThemeManager from './ThemeManager';
import './Settings.css';

interface SettingsProps {
  onClose: () => void;
  onThemeChange: (theme: 'dark' | 'light') => void;
}

const SETTINGS_KEY = 'app-settings';

const Settings: React.FC<SettingsProps> = ({ onClose, onThemeChange }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    return saved ? JSON.parse(saved) : defaultSettings;
  });
  const [showThemeManager, setShowThemeManager] = useState(false);
  const [currentThemeId, setCurrentThemeId] = useState(() => {
    return localStorage.getItem('current-theme-id') || 'dark';
  });

  const handleSave = () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    onThemeChange(settings.theme);
    onClose();
  };

  const handleReset = () => {
    setSettings(defaultSettings);
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Настройки</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="settings-content">
          <div className="settings-section">
            <h3>Общие настройки</h3>

            <div className="setting-item">
              <label>Язык</label>
              <select
                value={settings.language}
                onChange={(e) => setSettings({ ...settings, language: e.target.value as 'en' | 'ru' })}
              >
                <option value="ru">Русский</option>
                <option value="en">English</option>
              </select>
            </div>

            <div className="setting-item">
              <label>Тема</label>
              <div className="theme-selector">
                <select
                  value={settings.theme}
                  onChange={(e) => setSettings({ ...settings, theme: e.target.value as 'dark' | 'light' })}
                >
                  <option value="dark">Темная</option>
                  <option value="light">Светлая</option>
                </select>
                <button
                  className="theme-manager-btn"
                  onClick={() => setShowThemeManager(true)}
                  title="Управление темами"
                >
                  🎨 Темы
                </button>
              </div>
            </div>

            <div className="setting-item">
              <label>Размер шрифта</label>
              <select
                value={settings.fontSize || 'medium'}
                onChange={(e) => {
                  const newSettings = { ...settings, fontSize: e.target.value as 'small' | 'medium' | 'large' };
                  setSettings(newSettings);
                  document.documentElement.style.fontSize = e.target.value === 'small' ? '14px' : e.target.value === 'large' ? '18px' : '16px';
                }}
              >
                <option value="small">Маленький</option>
                <option value="medium">Средний</option>
                <option value="large">Большой</option>
              </select>
            </div>

            <div className="setting-item">
              <label>Длина ответов</label>
              <select
                value={settings.responseLength}
                onChange={(e) => setSettings({ ...settings, responseLength: e.target.value as 'short' | 'standard' | 'detailed' })}
              >
                <option value="short">Короткие (500 токенов, быстро)</option>
                <option value="standard">Стандартные (2000 токенов)</option>
                <option value="detailed">Развернутые (4000 токенов, медленно)</option>
              </select>
              <small>Влияет на скорость и длину ответов от моделей</small>
            </div>

            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.autoSave}
                  onChange={(e) => setSettings({ ...settings, autoSave: e.target.checked })}
                />
                Автосохранение чатов и настроек
              </label>
            </div>
          </div>
        </div>

        <div className="settings-footer">
          <button onClick={handleReset} className="reset-btn">Сбросить</button>
          <div className="footer-actions">
            <button onClick={onClose} className="cancel-btn">Отмена</button>
            <button onClick={handleSave} className="save-btn">Сохранить</button>
          </div>
        </div>
      </div>
      {showThemeManager && (
        <ThemeManager
          currentThemeId={currentThemeId}
          onThemeChange={(themeId) => {
            setCurrentThemeId(themeId);
            setShowThemeManager(false);
          }}
          onClose={() => setShowThemeManager(false)}
        />
      )}
    </div>
  );
};

export default Settings;

export const getSettings = (): AppSettings => {
  const saved = localStorage.getItem(SETTINGS_KEY);
  return saved ? JSON.parse(saved) : defaultSettings;
};
