import React, { useState, useEffect } from 'react';
import './UpdateNotification.css';

interface UpdateInfo {
  version: string;
  releaseDate?: string;
  releaseNotes?: string;
}

interface ProgressInfo {
  percent: number;
  transferred: number;
  total: number;
}

const UpdateNotification: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<ProgressInfo | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!window.electronAPI) return;

    // Обновление доступно
    window.electronAPI.on('update-available', (info: UpdateInfo) => {
      setUpdateAvailable(true);
      setUpdateInfo(info);
      setIsDownloading(true);
    });

    // Прогресс загрузки
    window.electronAPI.on('update-download-progress', (progress: ProgressInfo) => {
      setDownloadProgress(progress);
    });

    // Обновление загружено
    window.electronAPI.on('update-downloaded', (info: UpdateInfo) => {
      setUpdateDownloaded(true);
      setIsDownloading(false);
      setUpdateInfo(info);
    });

    return () => {
      window.electronAPI?.removeListener('update-available', () => {});
      window.electronAPI?.removeListener('update-download-progress', () => {});
      window.electronAPI?.removeListener('update-downloaded', () => {});
    };
  }, []);

  const handleInstallUpdate = () => {
    // Перезапуск приложения для установки обновления
    // Это будет обработано автоматически при закрытии
    if (window.confirm('Перезапустить приложение для установки обновления?')) {
      window.close();
    }
  };

  const handleDismiss = () => {
    setUpdateAvailable(false);
    setUpdateDownloaded(false);
  };

  if (!updateAvailable && !updateDownloaded) return null;

  return (
    <div className="update-notification">
      {isDownloading && downloadProgress && (
        <div className="update-downloading">
          <div className="update-header">
            <span className="update-icon">⬇️</span>
            <span className="update-title">Загрузка обновления...</span>
          </div>
          <div className="update-progress">
            <div
              className="update-progress-bar"
              style={{ width: `${downloadProgress.percent}%` }}
            />
          </div>
          <div className="update-progress-text">
            {Math.round(downloadProgress.percent)}% ({Math.round(downloadProgress.transferred / 1024 / 1024)}MB / {Math.round(downloadProgress.total / 1024 / 1024)}MB)
          </div>
        </div>
      )}

      {updateDownloaded && (
        <div className="update-ready">
          <div className="update-header">
            <span className="update-icon">✅</span>
            <span className="update-title">Обновление готово!</span>
            <button className="update-close" onClick={handleDismiss}>×</button>
          </div>
          <div className="update-content">
            <p>Версия {updateInfo?.version} загружена и готова к установке.</p>
            <div className="update-actions">
              <button className="update-btn update-btn-primary" onClick={handleInstallUpdate}>
                Перезапустить и установить
              </button>
              <button className="update-btn update-btn-secondary" onClick={handleDismiss}>
                Позже
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdateNotification;
