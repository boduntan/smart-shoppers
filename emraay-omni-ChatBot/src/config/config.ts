export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  appTitle: import.meta.env.VITE_APP_TITLE,
  appLocale: import.meta.env.VITE_APP_LOCALE,
  apiMode: import.meta.env.VITE_API_MODE || 'live', // 'mock' or 'live'
} as const;
