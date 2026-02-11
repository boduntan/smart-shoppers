import { config } from '@/config/config';

export const logger = {
  info: (message: string, ...args: unknown[]) => {
    console.log(`ℹ️ [INFO] ${message}`, ...args);
  },

  success: (message: string, ...args: unknown[]) => {
    console.log(`✅ [SUCCESS] ${message}`, ...args);
  },

  error: (message: string, ...args: unknown[]) => {
    console.error(`❌ [ERROR] ${message}`, ...args);
  },

  warn: (message: string, ...args: unknown[]) => {
    console.warn(`⚠️ [WARN] ${message}`, ...args);
  },

  debug: (message: string, ...args: unknown[]) => {
    if (import.meta.env.DEV) {
      console.debug(`🐛 [DEBUG] ${message}`, ...args);
    }
  },

  apiRequest: (method: string, url: string, payload?: unknown) => {
    console.log(`📤 [API ${method}] ${url}`, payload || '');
  },

  apiResponse: (method: string, url: string, status: number, data?: unknown) => {
    console.log(`📥 [API ${method}] ${url} - Status: ${status}`, data || '');
  },

  apiError: (method: string, url: string, error: unknown) => {
    console.error(`❌ [API ${method}] ${url} - Error:`, error);
  },
};

// Log app initialization
logger.info('Application initialized', {
  env: import.meta.env.MODE,
  apiUrl: config.apiBaseUrl,
});
