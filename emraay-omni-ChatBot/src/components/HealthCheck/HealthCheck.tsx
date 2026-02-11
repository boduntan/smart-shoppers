import { useState } from 'react';
import { useApiHealth } from '@/context/ApiHealthContext';
import { chatService } from '@/services/chatService';
import { productService } from '@/services/productService';
import './HealthCheck.scss';

interface ServiceStatus {
  chat: boolean;
  products: boolean;
  loading: boolean;
  error: string | null;
}

export const HealthCheck = () => {
  const { isHealthy, isChecking, error: apiError, apiMode, recheckHealth } = useApiHealth();
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>({
    chat: false,
    products: false,
    loading: false,
    error: null,
  });

  const testServices = async () => {
    if (!isHealthy && apiMode === 'live') {
      console.warn('⚠️ API not healthy - skipping service tests');
      return;
    }

    setServiceStatus({ chat: false, products: false, loading: true, error: null });

    try {
      // Test Chat Endpoint
      let chatHealthy = false;
      try {
        await chatService.sendSimpleMessage('health check');
        chatHealthy = true;
      } catch (err) {
        console.error('Chat test failed:', err);
      }

      // Test Products Endpoint
      let productsHealthy = false;
      try {
        const products = await productService.getProducts({ limit: 1 });
        productsHealthy = products.success;
      } catch (err) {
        console.error('Products test failed:', err);
      }

      setServiceStatus({
        chat: chatHealthy,
        products: productsHealthy,
        loading: false,
        error: null,
      });
    } catch (error) {
      setServiceStatus({
        chat: false,
        products: false,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleRefresh = async () => {
    await recheckHealth();
    if (isHealthy || apiMode === 'mock') {
      await testServices();
    }
  };

  const getStatusIcon = (healthy: boolean) => (healthy ? '✅' : '❌');

  return (
    <div className="health-check">
      <div className="health-check__header">
        <h3>Backend Integration Status</h3>
        <button onClick={handleRefresh} disabled={isChecking || serviceStatus.loading}>
          {isChecking || serviceStatus.loading ? 'Checking...' : 'Refresh'}
        </button>
      </div>

      {/* API Mode Indicator */}
      <div className={`health-check__mode ${apiMode === 'mock' ? 'mock-mode' : 'live-mode'}`}>
        {apiMode === 'mock' ? '🎭 Mock Mode - No Backend Required' : '🌐 Live API Mode'}
      </div>

      <div className="health-check__status">
        {isChecking ? (
          <div className="health-check__loading">Checking API connectivity...</div>
        ) : apiError && apiMode === 'live' ? (
          <div className="health-check__error">
            <span>❌</span> API Error: {apiError}
            <p className="health-check__hint">
              💡 Tip: Switch to Mock Mode in .env: VITE_API_MODE=mock
            </p>
          </div>
        ) : (
          <>
            <div className={`health-check__item ${isHealthy ? 'healthy' : 'unhealthy'}`}>
              <span className="icon">{getStatusIcon(isHealthy)}</span>
              <span className="label">API Connection</span>
            </div>
            {serviceStatus.loading ? (
              <div className="health-check__loading">Testing services...</div>
            ) : (
              <>
                <div className={`health-check__item ${serviceStatus.chat ? 'healthy' : 'unknown'}`}>
                  <span className="icon">{serviceStatus.chat ? '✅' : '⚪'}</span>
                  <span className="label">Chat Service</span>
                </div>
                <div className={`health-check__item ${serviceStatus.products ? 'healthy' : 'unknown'}`}>
                  <span className="icon">{serviceStatus.products ? '✅' : '⚪'}</span>
                  <span className="label">Product Service</span>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {!isChecking && isHealthy && (
        <div className="health-check__success">
          {apiMode === 'mock' 
            ? '🎭 Mock API ready - All features available for testing!' 
            : '🚀 All backend services are operational!'}
        </div>
      )}
    </div>
  );
};
