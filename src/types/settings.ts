export interface AppSettings {
  language: 'en' | 'ru';
  autoSave: boolean;
  theme: 'dark' | 'light';
  responseLength: 'short' | 'standard' | 'detailed';
  fontSize?: 'small' | 'medium' | 'large';
}

export const defaultSettings: AppSettings = {
  language: 'ru',
  autoSave: true,
  theme: 'dark',
  responseLength: 'standard',
  fontSize: 'medium'
};

export const getMaxTokensForLength = (length: 'short' | 'standard' | 'detailed'): number => {
  const tokenMap = {
    short: 500,
    standard: 2000,
    detailed: 4000
  };
  return tokenMap[length];
};
