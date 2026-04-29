import React, { useState, useEffect } from 'react';
import './PromptTemplates.css';

interface PromptTemplate {
  id: string;
  name: string;
  prompt: string;
  category: string;
}

interface PromptTemplatesProps {
  onClose: () => void;
  onSelectTemplate: (prompt: string) => void;
}

const defaultTemplates: PromptTemplate[] = [
  {
    id: '1',
    name: 'Объяснить код',
    prompt: 'Объясни следующий код подробно, включая его назначение и как он работает:\n\n',
    category: 'Программирование'
  },
  {
    id: '2',
    name: 'Рефакторинг кода',
    prompt: 'Проведи рефакторинг следующего кода, улучши читаемость и производительность:\n\n',
    category: 'Программирование'
  },
  {
    id: '3',
    name: 'Найти баги',
    prompt: 'Проанализируй следующий код и найди потенциальные баги или проблемы:\n\n',
    category: 'Программирование'
  },
  {
    id: '4',
    name: 'Написать тесты',
    prompt: 'Напиши unit-тесты для следующего кода:\n\n',
    category: 'Программирование'
  },
  {
    id: '5',
    name: 'Документация API',
    prompt: 'Создай документацию для следующего API endpoint:\n\n',
    category: 'Документация'
  },
  {
    id: '6',
    name: 'Перевести текст',
    prompt: 'Переведи следующий текст на английский язык:\n\n',
    category: 'Перевод'
  },
  {
    id: '7',
    name: 'Улучшить текст',
    prompt: 'Улучши следующий текст, сделай его более профессиональным и понятным:\n\n',
    category: 'Написание'
  },
  {
    id: '8',
    name: 'Резюме текста',
    prompt: 'Создай краткое резюме следующего текста:\n\n',
    category: 'Анализ'
  },
  {
    id: '9',
    name: 'SQL запрос',
    prompt: 'Напиши SQL запрос для следующей задачи:\n\n',
    category: 'База данных'
  },
  {
    id: '10',
    name: 'Regex паттерн',
    prompt: 'Создай регулярное выражение для следующей задачи:\n\n',
    category: 'Программирование'
  }
];

const STORAGE_KEY = 'prompt-templates';

const PromptTemplates: React.FC<PromptTemplatesProps> = ({ onClose, onSelectTemplate }) => {
  const [templates, setTemplates] = useState<PromptTemplate[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : defaultTemplates;
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTemplate, setNewTemplate] = useState<Partial<PromptTemplate>>({
    name: '',
    prompt: '',
    category: 'Пользовательские'
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('Все');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  }, [templates]);

  const categories = ['Все', ...Array.from(new Set(templates.map(t => t.category)))];

  const filteredTemplates = selectedCategory === 'Все'
    ? templates
    : templates.filter(t => t.category === selectedCategory);

  const handleAddTemplate = () => {
    if (!newTemplate.name || !newTemplate.prompt) return;

    if (editingId) {
      setTemplates(templates.map(t =>
        t.id === editingId ? { ...newTemplate, id: editingId } as PromptTemplate : t
      ));
      setEditingId(null);
    } else {
      const template: PromptTemplate = {
        id: Date.now().toString(),
        name: newTemplate.name,
        prompt: newTemplate.prompt,
        category: newTemplate.category || 'Пользовательские'
      };
      setTemplates([...templates, template]);
    }

    setShowAddModal(false);
    setNewTemplate({ name: '', prompt: '', category: 'Пользовательские' });
  };

  const handleEditTemplate = (template: PromptTemplate) => {
    setEditingId(template.id);
    setNewTemplate(template);
    setShowAddModal(true);
  };

  const handleDeleteTemplate = (id: string) => {
    if (confirm('Удалить этот шаблон?')) {
      setTemplates(templates.filter(t => t.id !== id));
    }
  };

  const handleResetToDefaults = () => {
    if (confirm('Сбросить все шаблоны к значениям по умолчанию?')) {
      setTemplates(defaultTemplates);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="prompt-templates-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Шаблоны промптов</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="templates-toolbar">
          <div className="category-filter">
            {categories.map(cat => (
              <button
                key={cat}
                className={selectedCategory === cat ? 'active' : ''}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="toolbar-actions">
            <button onClick={() => setShowAddModal(true)}>+ Новый шаблон</button>
            <button onClick={handleResetToDefaults}>↻ Сбросить</button>
          </div>
        </div>

        <div className="templates-grid">
          {filteredTemplates.map(template => (
            <div key={template.id} className="template-card">
              <div className="template-header">
                <h3>{template.name}</h3>
                <span className="template-category">{template.category}</span>
              </div>
              <div className="template-prompt">{template.prompt}</div>
              <div className="template-actions">
                <button onClick={() => onSelectTemplate(template.prompt)}>Использовать</button>
                <button onClick={() => handleEditTemplate(template)}>✎</button>
                <button onClick={() => handleDeleteTemplate(template.id)}>×</button>
              </div>
            </div>
          ))}
        </div>

        {showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="add-template-modal" onClick={(e) => e.stopPropagation()}>
              <h3>{editingId ? 'Редактировать шаблон' : 'Новый шаблон'}</h3>
              <input
                type="text"
                placeholder="Название шаблона"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
              />
              <input
                type="text"
                placeholder="Категория"
                value={newTemplate.category}
                onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
              />
              <textarea
                placeholder="Текст промпта"
                value={newTemplate.prompt}
                onChange={(e) => setNewTemplate({ ...newTemplate, prompt: e.target.value })}
                rows={8}
              />
              <div className="modal-actions">
                <button onClick={handleAddTemplate}>
                  {editingId ? 'Сохранить' : 'Создать'}
                </button>
                <button onClick={() => {
                  setShowAddModal(false);
                  setEditingId(null);
                  setNewTemplate({ name: '', prompt: '', category: 'Пользовательские' });
                }}>
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromptTemplates;
