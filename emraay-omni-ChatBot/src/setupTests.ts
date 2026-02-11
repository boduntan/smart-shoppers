import '@testing-library/jest-dom';

// Mock config to avoid import.meta issues in Jest
jest.mock('@/config/config', () => ({
  config: {
    apiBaseUrl: 'https://api.dev.aks.staplescan.com/ecommerce/chatbot/v1.0/api',
    appTitle: 'Emraay-Solutions Smart Shopper',
    appLocale: 'en-CA',
  },
}));

// Mock logger to avoid console noise in tests
jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    apiRequest: jest.fn(),
    apiResponse: jest.fn(),
    apiError: jest.fn(),
  },
}));

// Mock staples-hk loader
jest.mock('staples-hk/loader', () => ({
  defineCustomElements: jest.fn(),
}));
