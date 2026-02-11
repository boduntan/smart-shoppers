import { apiClient } from './apiClient';

export interface HealthResponse {
  success: boolean;
  message: string;
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
}

export const healthService = {
  checkHealth: async (): Promise<HealthResponse> => {
    const { data } = await apiClient.get<HealthResponse>('/health');
    return data;
  },

  checkDbHealth: async (): Promise<HealthResponse> => {
    const { data } = await apiClient.get<HealthResponse>('/health/db');
    return data;
  },
};
