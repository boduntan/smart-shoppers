import axios, { AxiosInstance, AxiosError } from 'axios';
import { config } from '@/config/config';
import { logger } from '@/utils/logger';
import { mockResponses, generateChatResponse } from './mockApi';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.apiBaseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (requestConfig) => {
        const method = requestConfig.method?.toUpperCase() || 'GET';
        const url = requestConfig.url || '';
        
        logger.apiRequest(method, url, requestConfig.data);
        
        // In mock mode, log that we're using mock data and prevent actual request
        if (config.apiMode === 'mock') {
          console.log(`🎭 Mock API: ${method} ${url}`);
          
          // Return a promise that immediately resolves with mock data
          const mockData = this.getMockResponseSync(requestConfig);
          
          // Create a mock response that looks like an axios response
          const mockResponse = {
            data: mockData,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: requestConfig,
          };
          
          // Throw a special error with the mock response attached
          // This will be caught by the response error interceptor
          const mockError: any = new Error('MOCK_MODE');
          mockError.config = requestConfig;
          mockError.mockResponse = mockResponse;
          return Promise.reject(mockError);
        }
        
        return requestConfig;
      },
      (error) => {
        logger.apiError('REQUEST', '', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor with mock support
    this.client.interceptors.response.use(
      (response) => {
        // In mock mode, ensure response has correct structure
        if (config.apiMode === 'mock' && response.data) {
          // Mock responses should already be properly structured
          logger.apiResponse(
            response.config.method?.toUpperCase() || 'GET',
            response.config.url || '',
            response.status,
            response.data
          );
        } else {
          logger.apiResponse(
            response.config.method?.toUpperCase() || 'GET',
            response.config.url || '',
            response.status,
            response.data
          );
        }
        return response;
      },
      (error: AxiosError | any) => {
        // Handle mock mode responses
        if (config.apiMode === 'mock' && error.message === 'MOCK_MODE' && error.mockResponse) {
          logger.apiResponse(
            error.config?.method?.toUpperCase() || 'GET',
            error.config?.url || '',
            200,
            error.mockResponse.data
          );
          return Promise.resolve(error.mockResponse);
        }
        
        // In mock mode, intercept network errors and return mock data
        if (config.apiMode === 'mock') {
          console.log(`🎭 Mock mode: Intercepting failed request to ${error.config?.url}`);
          const mockResponse = this.getMockResponseSync(error.config);
          
          logger.apiResponse(
            error.config?.method?.toUpperCase() || 'GET',
            error.config?.url || '',
            200,
            mockResponse
          );
          
          // Return successful mock response
          return Promise.resolve({
            data: mockResponse,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: error.config || {},
          });
        }

        // In live mode, let errors through
        const url = error.config?.url || '';
        const method = error.config?.method?.toUpperCase() || 'REQUEST';
        
        logger.apiError(method, url, error.response?.data || error.message);
        
        return Promise.reject(error);
      }
    );
  }

  private getMockResponseSync(requestConfig: unknown) {
    const config = requestConfig as { url?: string; method?: string; data?: { message?: string; sessionId?: string } };
    const url = config?.url || '';
    const method = config?.method?.toUpperCase() || 'GET';
    
    logger.info(`🎭 Mock API: ${method} ${url}`);

    if (url.includes('/health')) {
      return mockResponses.health;
    } else if (url.includes('/chat/simple') || url.includes('/chat/conversation')) {
      const message = config.data?.message || 'Hello';
      const sessionId = config.data?.sessionId;
      return generateChatResponse(message, sessionId);
    } else if (url.includes('/categories/list')) {
      return mockResponses.categoriesList;
    } else if (url.includes('/products')) {
      return mockResponses.products;
    } else if (url.includes('/faq')) {
      return mockResponses.faqSearch;
    } else if (url.includes('/analytics')) {
      return mockResponses.analytics;
    } else {
      return { success: true, data: { message: 'Mock response', url } };
    }
  }

  getInstance(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient().getInstance();
