import { ApiHealthProvider, useApiHealth } from '@/context/ApiHealthContext';
import { SmartShopperWidget } from '@/components/SmartShopperWidget/SmartShopperWidget';
import { FeatureShowcase } from '@/components/FeatureShowcase/FeatureShowcase';
import './App.scss';

function AppContent() {
  const { isHealthy, apiMode } = useApiHealth();

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__content">
          <h1>Emraay-Solutions Smart Shopper</h1>
          <p>AI-Powered Shopping Assistant</p>
        </div>
        {isHealthy && (
          <div className="app-header__status">
            <span className="status-badge healthy">
              ✅ {apiMode === 'mock' ? 'Mock Mode' : 'Connected'}
            </span>
          </div>
        )}
      </header>
      <main className="app-main">
        <div className="welcome-content">
          <h2>Welcome to Emraay-Solutions Smart Shopper</h2>
          <p>Click the chat bubble in the bottom-right corner to start shopping with AI assistance!</p>
          
          {/* Feature testing panel - can be hidden for production */}
          <details className="feature-testing">
            <summary>🧪 API Feature Testing (for developers)</summary>
            <FeatureShowcase />
          </details>
        </div>
      </main>
      
      {/* Main chat widget */}
      <SmartShopperWidget />
    </div>
  );
}

function App() {
  return (
    <ApiHealthProvider>
      <AppContent />
    </ApiHealthProvider>
  );
}

export default App;
