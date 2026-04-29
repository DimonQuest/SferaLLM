export interface ErrorInfo {
  title: string;
  message: string;
  suggestion?: string;
}

export const parseApiError = (error: any, provider: string): ErrorInfo => {
  // HTTP статус коды
  if (error.message?.includes('HTTP 401')) {
    return {
      title: 'Ошибка авторизации',
      message: 'Неверный API ключ',
      suggestion: 'Проверьте правильность API ключа в настройках чата'
    };
  }

  if (error.message?.includes('HTTP 402')) {
    return {
      title: 'Недостаточно средств',
      message: 'На вашем аккаунте закончились кредиты',
      suggestion: 'Пополните баланс или используйте другой провайдер'
    };
  }

  if (error.message?.includes('HTTP 403')) {
    return {
      title: 'Доступ запрещен',
      message: 'У вас нет доступа к этой модели',
      suggestion: 'Проверьте права доступа или выберите другую модель'
    };
  }

  if (error.message?.includes('HTTP 404')) {
    return {
      title: 'Модель не найдена',
      message: 'Указанная модель не существует',
      suggestion: 'Проверьте название модели или выберите другую'
    };
  }

  if (error.message?.includes('HTTP 429')) {
    return {
      title: 'Превышен лимит запросов',
      message: 'Слишком много запросов за короткое время',
      suggestion: 'Подождите немного и попробуйте снова'
    };
  }

  if (error.message?.includes('HTTP 500') || error.message?.includes('HTTP 502') || error.message?.includes('HTTP 503')) {
    return {
      title: 'Ошибка сервера',
      message: 'Сервер провайдера временно недоступен',
      suggestion: 'Попробуйте позже или используйте другой провайдер'
    };
  }

  // Сетевые ошибки
  if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
    return {
      title: 'Ошибка сети',
      message: 'Не удалось подключиться к серверу',
      suggestion: provider === 'omniroute'
        ? 'Проверьте что OmniRoute сервер запущен и доступен'
        : 'Проверьте подключение к интернету'
    };
  }

  if (error.message?.includes('timeout')) {
    return {
      title: 'Превышено время ожидания',
      message: 'Сервер не ответил вовремя',
      suggestion: 'Попробуйте снова или уменьшите размер запроса'
    };
  }

  // Ошибки парсинга
  if (error.message?.includes('JSON')) {
    return {
      title: 'Ошибка формата данных',
      message: 'Получен некорректный ответ от сервера',
      suggestion: 'Возможно, сервер работает неправильно. Попробуйте позже'
    };
  }

  // Общая ошибка
  return {
    title: 'Произошла ошибка',
    message: error.message || 'Неизвестная ошибка',
    suggestion: 'Попробуйте снова или обратитесь в поддержку'
  };
};

export const logError = (context: string, error: any, details?: any) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ${context}:`, error, details);

  // В продакшене можно отправлять в систему логирования
  // sendToLoggingService({ timestamp, context, error, details });
};
