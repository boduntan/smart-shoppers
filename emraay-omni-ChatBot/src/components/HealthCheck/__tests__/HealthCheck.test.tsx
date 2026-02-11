import { render, screen, waitFor } from '@testing-library/react';
import { HealthCheck } from '../HealthCheck';
import { ApiHealthProvider } from '@/context/ApiHealthContext';
import { chatService } from '@/services/chatService';
import { productService } from '@/services/productService';

jest.mock('@/services/healthService');
jest.mock('@/services/chatService');
jest.mock('@/services/productService');

// Mock config
jest.mock('@/config/config', () => ({
  config: {
    apiBaseUrl: 'http://localhost:3001/api',
    apiMode: 'mock',
  },
}));

// Mock fetch for health check
global.fetch = jest.fn();

describe('HealthCheck', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: mock mode healthy
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
  });

  it('shows mode indicator and health status', async () => {
    (chatService.sendSimpleMessage as jest.Mock).mockResolvedValue({});
    (productService.getProducts as jest.Mock).mockResolvedValue({ success: true });

    render(
      <ApiHealthProvider>
        <HealthCheck />
      </ApiHealthProvider>
    );

    // Should show mode indicator
    await waitFor(() => {
      expect(screen.getByText(/Mock Mode|Live API Mode/)).toBeInTheDocument();
    });
  });

  it('renders without crashing in mock mode', async () => {
    render(
      <ApiHealthProvider>
        <HealthCheck />
      </ApiHealthProvider>
    );

    // Component should render
    await waitFor(() => {
      expect(screen.getByText('Backend Integration Status')).toBeInTheDocument();
    });
  });
});
