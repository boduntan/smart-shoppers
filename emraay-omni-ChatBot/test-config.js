import { config } from './src/config/config';

console.log('=== Configuration Check ===');
console.log('API Base URL:', config.apiBaseUrl);
console.log('API Mode:', config.apiMode);
console.log('App Title:', config.appTitle);
console.log('App Locale:', config.appLocale);
console.log('=========================');

if (config.apiMode === 'mock') {
  console.log('✅ Mock mode is ENABLED');
} else {
  console.log('❌ Mock mode is DISABLED - using live API');
}
