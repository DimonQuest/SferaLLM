// Обработчик инструментов для AI (как в Claude Code)

import { PermissionManager, PermissionRequest } from './permissionManager';

export interface Tool {
  type: string;
  function: {
    name: string;
    description: string;
    parameters: any;
  };
}

export interface ToolCall {
  tool: string;
  parameters: any;
  chatId: string;
}

export interface ToolResult {
  success: boolean;
  result?: any;
  error?: string;
}

export class ToolHandler {
  // Список доступных инструментов
  static getAvailableTools(): Tool[] {
    return [
      {
        type: 'function',
        function: {
          name: 'read_file',
          description: 'Читает содержимое файла',
          parameters: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'Путь к файлу' }
            },
            required: ['path']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'write_file',
          description: 'Записывает содержимое в файл',
          parameters: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'Путь к файлу' },
              content: { type: 'string', description: 'Содержимое файла' }
            },
            required: ['path', 'content']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'edit_file',
          description: 'Редактирует файл (замена текста)',
          parameters: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'Путь к файлу' },
              old_text: { type: 'string', description: 'Текст для замены' },
              new_text: { type: 'string', description: 'Новый текст' }
            },
            required: ['path', 'old_text', 'new_text']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'list_directory',
          description: 'Показывает содержимое папки',
          parameters: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'Путь к папке' }
            },
            required: ['path']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'execute_command',
          description: 'Выполняет команду в терминале',
          parameters: {
            type: 'object',
            properties: {
              command: { type: 'string', description: 'Команда для выполнения' },
              cwd: { type: 'string', description: 'Рабочая директория' }
            },
            required: ['command']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'search_files',
          description: 'Ищет файлы по паттерну',
          parameters: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'Путь для поиска' },
              pattern: { type: 'string', description: 'Паттерн поиска (glob)' }
            },
            required: ['path', 'pattern']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'create_directory',
          description: 'Создает новую папку',
          parameters: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'Путь к новой папке' }
            },
            required: ['path']
          }
        }
      }
    ];
  }

  // Выполнение инструмента
  static async executeTool(call: ToolCall): Promise<ToolResult> {
    try {
      switch (call.tool) {
        case 'read_file':
          return await this.readFile(call);
        case 'write_file':
          return await this.writeFile(call);
        case 'edit_file':
          return await this.editFile(call);
        case 'list_directory':
          return await this.listDirectory(call);
        case 'execute_command':
          return await this.executeCommand(call);
        case 'search_files':
          return await this.searchFiles(call);
        case 'create_directory':
          return await this.createDirectory(call);
        default:
          return {
            success: false,
            error: `Unknown tool: ${call.tool}`
          };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  private static async readFile(call: ToolCall): Promise<ToolResult> {
    const { path } = call.parameters;

    // Запрашиваем разрешение
    const request: PermissionRequest = {
      type: 'read-file',
      path,
      reason: 'AI хочет прочитать файл для анализа',
      action: `Чтение: ${path}`
    };

    const granted = await PermissionManager.requestPermission(call.chatId, request);
    if (!granted) {
      return { success: false, error: 'Permission denied' };
    }

    // Используем Electron API
    if (window.electronAPI) {
      const content = await window.electronAPI.file.readFile(path);
      return { success: true, result: content };
    }

    return { success: false, error: 'File API not available' };
  }

  private static async writeFile(call: ToolCall): Promise<ToolResult> {
    const { path, content } = call.parameters;

    const request: PermissionRequest = {
      type: 'write-file',
      path,
      reason: 'AI хочет записать файл',
      action: `Запись: ${path}`
    };

    const granted = await PermissionManager.requestPermission(call.chatId, request);
    if (!granted) {
      return { success: false, error: 'Permission denied' };
    }

    if (window.electronAPI) {
      await window.electronAPI.file.writeFile(path, content);
      return { success: true, result: 'File written successfully' };
    }

    return { success: false, error: 'File API not available' };
  }

  private static async editFile(call: ToolCall): Promise<ToolResult> {
    const { path, old_text, new_text } = call.parameters;

    const request: PermissionRequest = {
      type: 'edit-file',
      path,
      reason: 'AI хочет отредактировать файл',
      action: `Редактирование: ${path}`
    };

    const granted = await PermissionManager.requestPermission(call.chatId, request);
    if (!granted) {
      return { success: false, error: 'Permission denied' };
    }

    if (window.electronAPI) {
      // Читаем файл
      const content = await window.electronAPI.file.readFile(path);

      // Заменяем текст
      const newContent = content.replace(old_text, new_text);

      // Записываем обратно
      await window.electronAPI.file.writeFile(path, newContent);

      return { success: true, result: 'File edited successfully' };
    }

    return { success: false, error: 'File API not available' };
  }

  private static async listDirectory(call: ToolCall): Promise<ToolResult> {
    const { path } = call.parameters;

    const request: PermissionRequest = {
      type: 'list-directory',
      path,
      reason: 'AI хочет просмотреть содержимое папки',
      action: `Список: ${path}`
    };

    const granted = await PermissionManager.requestPermission(call.chatId, request);
    if (!granted) {
      return { success: false, error: 'Permission denied' };
    }

    if (window.electronAPI) {
      const files = await window.electronAPI.fs.listDirectory(path);
      const formatted = files.map((f: any) =>
        `${f.isDirectory ? '📁' : '📄'} ${f.name}`
      ).join('\n');
      return { success: true, result: formatted };
    }

    return { success: false, error: 'FS API not available' };
  }

  private static async executeCommand(call: ToolCall): Promise<ToolResult> {
    const { command, cwd } = call.parameters;

    const request: PermissionRequest = {
      type: 'execute-command',
      path: cwd || process.cwd(),
      reason: 'AI хочет выполнить команду',
      action: `Команда: ${command}`
    };

    const granted = await PermissionManager.requestPermission(call.chatId, request);
    if (!granted) {
      return { success: false, error: 'Permission denied' };
    }

    if (window.electronAPI) {
      const output = await window.electronAPI.fs.executeCommand(command, cwd);
      return { success: true, result: output };
    }

    return { success: false, error: 'FS API not available' };
  }

  private static async searchFiles(call: ToolCall): Promise<ToolResult> {
    const { path, pattern } = call.parameters;

    const request: PermissionRequest = {
      type: 'search-files',
      path,
      reason: 'AI хочет найти файлы',
      action: `Поиск: ${pattern} в ${path}`
    };

    const granted = await PermissionManager.requestPermission(call.chatId, request);
    if (!granted) {
      return { success: false, error: 'Permission denied' };
    }

    if (window.electronAPI) {
      const files = await window.electronAPI.fs.searchFiles(path, pattern);
      return { success: true, result: files.join('\n') };
    }

    return { success: false, error: 'FS API not available' };
  }

  private static async createDirectory(call: ToolCall): Promise<ToolResult> {
    const { path } = call.parameters;

    const request: PermissionRequest = {
      type: 'create-directory',
      path,
      reason: 'AI хочет создать папку',
      action: `Создание: ${path}`
    };

    const granted = await PermissionManager.requestPermission(call.chatId, request);
    if (!granted) {
      return { success: false, error: 'Permission denied' };
    }

    if (window.electronAPI) {
      await window.electronAPI.fs.createDirectory(path);
      return { success: true, result: 'Directory created successfully' };
    }

    return { success: false, error: 'FS API not available' };
  }

  // Форматирование результата для отображения
  static formatToolResult(tool: string, result: ToolResult): string {
    if (!result.success) {
      return `❌ Ошибка: ${result.error}`;
    }

    switch (tool) {
      case 'read_file':
        return `📄 Файл прочитан:\n\`\`\`\n${result.result}\n\`\`\``;
      case 'write_file':
      case 'edit_file':
        return `✅ ${result.result}`;
      case 'list_directory':
        return `📁 Содержимое:\n${result.result}`;
      case 'execute_command':
        return `💻 Результат:\n\`\`\`\n${result.result}\n\`\`\``;
      default:
        return `✅ ${JSON.stringify(result.result)}`;
    }
  }
}
