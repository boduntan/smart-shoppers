import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { defineCustomElements } from 'staples-hk/loader';
import App from './App';
import './styles/global.scss';
import { config } from './config/config';

// Initialize Staples-HK web components
defineCustomElements();

// Debug: Log configuration on startup
console.log('%c🔧 Emraay-Solutions ChatBot Configuration', 'font-weight: bold; font-size: 14px; color: #1976d2');
console.log('API Base URL:', config.apiBaseUrl);
console.log('API Mode:', config.apiMode);
console.log('App Title:', config.appTitle);

if (config.apiMode === 'mock') {
  console.log('%c🎭 MOCK API MODE ENABLED', 'background: #ffe4b5; color: #cc6600; padding: 4px 8px; font-weight: bold');
  console.log('✅ Using mock data - No backend connection required');
  console.log('ℹ️  To use real API: Set VITE_API_MODE=live in .env file');
} else {
  console.log('%c🌐 LIVE API MODE', 'background: #90ee90; color: #006400; padding: 4px 8px; font-weight: bold');
  console.log('🔗 Connecting to:', config.apiBaseUrl);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
