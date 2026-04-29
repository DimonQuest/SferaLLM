export interface Theme {
  id: string;
  name: string;
  colors: {
    primary: string;
    primaryHover: string;
    primaryLight: string;
    bgPrimary: string;
    bgSecondary: string;
    bgTertiary: string;
    bgHover: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    borderColor: string;
    borderHover: string;
    error: string;
    success: string;
    warning: string;
  };
  fonts: {
    primary: string;
    code: string;
  };
  spacing: {
    radiusSm: string;
    radiusMd: string;
    radiusLg: string;
  };
}

export const defaultThemes: Theme[] = [
  {
    id: 'dark',
    name: 'Темная',
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
  },
  {
    id: 'light',
    name: 'Светлая',
    colors: {
      primary: '#3b82f6',
      primaryHover: '#2563eb',
      primaryLight: 'rgba(59, 130, 246, 0.1)',
      bgPrimary: '#ffffff',
      bgSecondary: '#f9fafb',
      bgTertiary: '#e5e7eb',
      bgHover: '#d1d5db',
      textPrimary: '#111827',
      textSecondary: '#374151',
      textMuted: '#6b7280',
      borderColor: '#e5e7eb',
      borderHover: '#d1d5db',
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
  },
  {
    id: 'nord',
    name: 'Nord',
    colors: {
      primary: '#88c0d0',
      primaryHover: '#81a1c1',
      primaryLight: 'rgba(136, 192, 208, 0.1)',
      bgPrimary: '#2e3440',
      bgSecondary: '#3b4252',
      bgTertiary: '#434c5e',
      bgHover: '#4c566a',
      textPrimary: '#eceff4',
      textSecondary: '#e5e9f0',
      textMuted: '#d8dee9',
      borderColor: '#4c566a',
      borderHover: '#5e81ac',
      error: '#bf616a',
      success: '#a3be8c',
      warning: '#ebcb8b'
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
  },
  {
    id: 'dracula',
    name: 'Dracula',
    colors: {
      primary: '#bd93f9',
      primaryHover: '#9580ff',
      primaryLight: 'rgba(189, 147, 249, 0.1)',
      bgPrimary: '#282a36',
      bgSecondary: '#21222c',
      bgTertiary: '#44475a',
      bgHover: '#6272a4',
      textPrimary: '#f8f8f2',
      textSecondary: '#e6e6e6',
      textMuted: '#a0a0a0',
      borderColor: '#44475a',
      borderHover: '#6272a4',
      error: '#ff5555',
      success: '#50fa7b',
      warning: '#f1fa8c'
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
  },
  {
    id: 'monokai',
    name: 'Monokai',
    colors: {
      primary: '#a6e22e',
      primaryHover: '#8fd919',
      primaryLight: 'rgba(166, 226, 46, 0.1)',
      bgPrimary: '#272822',
      bgSecondary: '#1e1f1c',
      bgTertiary: '#3e3d32',
      bgHover: '#49483e',
      textPrimary: '#f8f8f2',
      textSecondary: '#e6e6e6',
      textMuted: '#75715e',
      borderColor: '#3e3d32',
      borderHover: '#49483e',
      error: '#f92672',
      success: '#a6e22e',
      warning: '#e6db74'
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
  }
];

export const applyTheme = (theme: Theme): void => {
  const root = document.documentElement;

  Object.entries(theme.colors).forEach(([key, value]) => {
    const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    root.style.setProperty(cssVar, value);
  });

  root.style.setProperty('--font-primary', theme.fonts.primary);
  root.style.setProperty('--font-code', theme.fonts.code);
  root.style.setProperty('--radius-sm', theme.spacing.radiusSm);
  root.style.setProperty('--radius-md', theme.spacing.radiusMd);
  root.style.setProperty('--radius-lg', theme.spacing.radiusLg);
};

export const saveCustomTheme = (theme: Theme): void => {
  const customThemes = getCustomThemes();
  const existingIndex = customThemes.findIndex(t => t.id === theme.id);

  if (existingIndex >= 0) {
    customThemes[existingIndex] = theme;
  } else {
    customThemes.push(theme);
  }

  localStorage.setItem('custom-themes', JSON.stringify(customThemes));
};

export const getCustomThemes = (): Theme[] => {
  const saved = localStorage.getItem('custom-themes');
  return saved ? JSON.parse(saved) : [];
};

export const deleteCustomTheme = (themeId: string): void => {
  const customThemes = getCustomThemes();
  const filtered = customThemes.filter(t => t.id !== themeId);
  localStorage.setItem('custom-themes', JSON.stringify(filtered));
};

export const getAllThemes = (): Theme[] => {
  return [...defaultThemes, ...getCustomThemes()];
};
