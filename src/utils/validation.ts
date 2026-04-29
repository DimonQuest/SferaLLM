export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateChatConfig = (config: {
  name?: string;
  provider?: string;
  model?: string;
  apiKey?: string;
  baseUrl?: string;
}): ValidationResult => {
  const errors: string[] = [];

  // Проверка названия
  if (!config.name || config.name.trim().length === 0) {
    errors.push('Название чата обязательно');
  } else if (config.name.length > 50) {
    errors.push('Название чата не должно превышать 50 символов');
  }

  // Проверка провайдера
  if (!config.provider) {
    errors.push('Выберите провайдера');
  }

  // Проверка модели
  if (!config.model || config.model.trim().length === 0) {
    errors.push('Название модели обязательно');
  }

  // Проверка API ключа
  if (!config.apiKey || config.apiKey.trim().length === 0) {
    errors.push('API ключ обязателен');
  } else if (config.apiKey.length < 10) {
    errors.push('API ключ слишком короткий');
  }

  // Проверка Base URL для custom провайдера
  if (config.provider === 'custom' && config.baseUrl) {
    try {
      new URL(config.baseUrl);
    } catch {
      errors.push('Неверный формат Base URL');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateApiKey = (provider: string, apiKey: string): boolean => {
  if (!apiKey || apiKey.trim().length === 0) return false;

  const patterns: Record<string, RegExp> = {
    openai: /^sk-[a-zA-Z0-9]{48}$/,
    anthropic: /^sk-ant-[a-zA-Z0-9-]{95}$/,
    openrouter: /^sk-or-[a-zA-Z0-9-]+$/,
  };

  const pattern = patterns[provider];
  if (pattern) {
    return pattern.test(apiKey);
  }

  // Для остальных провайдеров - минимальная длина
  return apiKey.length >= 10;
};
