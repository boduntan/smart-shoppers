import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { config } from '@/config/config';
import { logger } from '@/utils/logger';
import { apiClient } from '@/services/apiClient';

interface ApiHealthContextType {
  isHealthy: boolean;
  isChecking: boolean;
  error: string | null;
  apiMode: 'mock' | 'live';
  recheckHealth: () => Promise<void>;
}

const ApiHealthContext = createContext<ApiHealthContextType | undefined>(undefined);

/** Try to fetch health; returns [ok, usedUrl] or [false, undefined]. */
async function tryHealth(baseUrl: string, signal?: AbortSignal): Promise<[boolean, string?]> {
  const url = `${baseUrl.replace(/\/$/, '')}/health`;
  const res = await fetch(url, { signal, method: 'GET' });
  if (res.ok) return [true, baseUrl];
  return [false, undefined];
}

export const ApiHealthProvider = ({ children }: { children: ReactNode }) => {
  const [isHealthy, setIsHealthy] = useState(true); // Start optimistically
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const apiMode = config.apiMode as 'mock' | 'live';

  const checkHealth = async () => {
    setIsChecking(true);
    setError(null);

    try {
      // If mock mode, always healthy
      if (apiMode === 'mock') {
        logger.info('🎭 Mock mode enabled - skipping health check');
        setIsHealthy(true);
        setIsChecking(false);
        return;
      }

      logger.info('🔍 Checking API health...');
      const primaryUrl = config.apiBaseUrl;
      const fallbackUrl =
        typeof window !== 'undefined'
          ? `${window.location.protocol}//${window.location.hostname}:3000/api`
          : '';

      let ok = false;
      let usedUrl: string | undefined;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      try {
        [ok, usedUrl] = await tryHealth(primaryUrl, controller.signal);
      } catch {
        usedUrl = undefined;
      }

      if (!ok && fallbackUrl && fallbackUrl !== primaryUrl) {
        const controller2 = new AbortController();
        const timeoutId2 = setTimeout(() => controller2.abort(), 6000);
        try {
          [ok, usedUrl] = await tryHealth(fallbackUrl, controller2.signal);
          if (ok && usedUrl) {
            (apiClient as any).defaults.baseURL = usedUrl;
            console.log('%c✅ Using fallback API:', 'color: #2196F3; font-weight: bold', usedUrl);
          }
        } catch {
          // ignore
        }
        clearTimeout(timeoutId2);
      }

      clearTimeout(timeoutId);

      if (ok) {
        const data = await fetch(`${usedUrl || primaryUrl}/health`).then((r) => r.json()).catch(() => ({}));
        logger.success('✅ API CONNECTION HEALTHY', data);
        console.log('%c✅ Backend API Connection Successful!', 'color: #4CAF50; font-size: 16px; font-weight: bold');
        console.log('API Endpoint:', usedUrl || primaryUrl);
        setIsHealthy(true);
      } else {
        throw new Error('API health check failed (tried build URL and same-host:3000)');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      logger.error('❌ API health check failed:', errorMsg);
      setError(errorMsg);
      setIsHealthy(false);
    } finally {
      setIsChecking(false);
    }
  };

  // Run health check on mount
  useEffect(() => {
    checkHealth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ApiHealthContext.Provider
      value={{
        isHealthy,
        isChecking,
        error,
        apiMode,
        recheckHealth: checkHealth,
      }}
    >
      {children}
    </ApiHealthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useApiHealth = (): ApiHealthContextType => {
  const context = useContext(ApiHealthContext);
  if (!context) {
    throw new Error('useApiHealth must be used within ApiHealthProvider');
  }
  return context;
};
