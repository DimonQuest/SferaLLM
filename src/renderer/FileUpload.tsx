import React, { useState, useRef, DragEvent } from 'react';
import './FileUpload.css';

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // в байтах
  maxFiles?: number;
}

interface UploadedFile {
  file: File;
  preview?: string;
  base64?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  accept = 'image/*,.pdf,.txt,.doc,.docx',
  multiple = true,
  maxSize = 10 * 1024 * 1024, // 10MB по умолчанию
  maxFiles = 5
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      processFiles(files);
    }
  };

  const processFiles = async (files: File[]) => {
    setError('');

    // Проверка количества файлов
    if (uploadedFiles.length + files.length > maxFiles) {
      setError(`Максимум ${maxFiles} файлов`);
      return;
    }

    // Проверка размера и типа
    const validFiles: File[] = [];
    for (const file of files) {
      if (file.size > maxSize) {
        setError(`Файл ${file.name} слишком большой (макс. ${formatFileSize(maxSize)})`);
        continue;
      }

      // Проверка типа файла
      const acceptedTypes = accept.split(',').map(t => t.trim());
      const fileType = file.type;
      const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();

      const isAccepted = acceptedTypes.some(type => {
        if (type.endsWith('/*')) {
          return fileType.startsWith(type.replace('/*', ''));
        }
        return type === fileType || type === fileExt;
      });

      if (!isAccepted) {
        setError(`Файл ${file.name} не поддерживается`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Создаем превью и base64 для изображений
    const processedFiles: UploadedFile[] = await Promise.all(
      validFiles.map(async (file) => {
        const uploadedFile: UploadedFile = { file };

        if (file.type.startsWith('image/')) {
          // Создаем превью
          uploadedFile.preview = URL.createObjectURL(file);

          // Конвертируем в base64 для отправки в API
          uploadedFile.base64 = await fileToBase64(file);
        }

        return uploadedFile;
      })
    );

    setUploadedFiles([...uploadedFiles, ...processedFiles]);
    onFileSelect(validFiles);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Убираем префикс data:image/...;base64,
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    const newFiles = [...uploadedFiles];
    const removed = newFiles.splice(index, 1)[0];

    // Освобождаем URL превью
    if (removed.preview) {
      URL.revokeObjectURL(removed.preview);
    }

    setUploadedFiles(newFiles);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const clearAll = () => {
    uploadedFiles.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setUploadedFiles([]);
    setError('');
  };

  return (
    <div className="file-upload-container">
      <div
        className={`file-upload-dropzone ${isDragging ? 'dragging' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />
        <div className="dropzone-content">
          <span className="dropzone-icon">📎</span>
          <p className="dropzone-text">
            Перетащите файлы сюда или нажмите для выбора
          </p>
          <p className="dropzone-hint">
            Поддерживаются: изображения, PDF, текстовые документы (макс. {formatFileSize(maxSize)})
          </p>
        </div>
      </div>

      {error && (
        <div className="file-upload-error">
          ⚠️ {error}
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="uploaded-files">
          <div className="uploaded-files-header">
            <span>Загружено файлов: {uploadedFiles.length}</span>
            <button className="clear-all-btn" onClick={clearAll}>
              Очистить все
            </button>
          </div>
          <div className="uploaded-files-list">
            {uploadedFiles.map((uploadedFile, index) => (
              <div key={index} className="uploaded-file-item">
                {uploadedFile.preview ? (
                  <img
                    src={uploadedFile.preview}
                    alt={uploadedFile.file.name}
                    className="file-preview-image"
                  />
                ) : (
                  <div className="file-preview-icon">
                    {getFileIcon(uploadedFile.file.type)}
                  </div>
                )}
                <div className="file-info">
                  <div className="file-name">{uploadedFile.file.name}</div>
                  <div className="file-size">
                    {formatFileSize(uploadedFile.file.size)}
                  </div>
                </div>
                <button
                  className="remove-file-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const getFileIcon = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType === 'application/pdf') return '📄';
  if (mimeType.includes('text')) return '📝';
  if (mimeType.includes('word')) return '📘';
  return '📎';
};

export default FileUpload;
