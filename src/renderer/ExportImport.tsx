import React, { useRef } from 'react';
import { Chat } from '../types';
import { exportChatsToJSON, exportChatsToMarkdown, importChatsFromJSON, downloadFile, readFile } from '../utils/exportImport';
import { exportToPDF, exportToHTML } from '../utils/pdfExport';
import './ExportImport.css';

interface ExportImportProps {
  chats: Chat[];
  onImport: (chats: Chat[]) => void;
  onClose: () => void;
}

const ExportImport: React.FC<ExportImportProps> = ({ chats, onImport, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportJSON = () => {
    const json = exportChatsToJSON(chats);
    const filename = `chats-export-${new Date().toISOString().split('T')[0]}.json`;
    downloadFile(json, filename, 'application/json');
  };

  const handleExportMarkdown = () => {
    const markdown = exportChatsToMarkdown(chats);
    const filename = `chats-export-${new Date().toISOString().split('T')[0]}.md`;
    downloadFile(markdown, filename, 'text/markdown');
  };

  const handleExportPDF = async () => {
    try {
      await exportToPDF(chats);
    } catch (error) {
      alert('Ошибка экспорта в PDF: ' + (error as Error).message);
    }
  };

  const handleExportHTML = () => {
    try {
      exportToHTML(chats);
    } catch (error) {
      alert('Ошибка экспорта в HTML: ' + (error as Error).message);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await readFile(file);
      const importedChats = importChatsFromJSON(content);

      if (confirm(`Импортировать ${importedChats.length} чатов? API ключи нужно будет ввести заново.`)) {
        onImport(importedChats);
        onClose();
      }
    } catch (error) {
      alert('Ошибка импорта: ' + (error as Error).message);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="export-import-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Экспорт / Импорт</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="export-import-content">
          <div className="section">
            <h3>📤 Экспорт чатов</h3>
            <p>Экспортируйте все чаты ({chats.length}) в файл</p>
            <div className="button-group">
              <button onClick={handleExportJSON} disabled={chats.length === 0}>
                Экспорт в JSON
              </button>
              <button onClick={handleExportMarkdown} disabled={chats.length === 0}>
                Экспорт в Markdown
              </button>
              <button onClick={handleExportHTML} disabled={chats.length === 0}>
                Экспорт в HTML
              </button>
              <button onClick={handleExportPDF} disabled={chats.length === 0}>
                Экспорт в PDF
              </button>
            </div>
            <div className="info-box">
              <strong>Примечание:</strong> API ключи не экспортируются по соображениям безопасности
            </div>
          </div>

          <div className="divider"></div>

          <div className="section">
            <h3>📥 Импорт чатов</h3>
            <p>Импортируйте чаты из JSON файла</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              style={{ display: 'none' }}
            />
            <button onClick={() => fileInputRef.current?.click()}>
              Выбрать файл для импорта
            </button>
            <div className="info-box">
              <strong>Примечание:</strong> После импорта нужно будет ввести API ключи для каждого чата
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportImport;
