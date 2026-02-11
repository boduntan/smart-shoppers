import { apiClient } from './apiClient';

export interface AnalyticsEvent {
  eventType: string;
  userId?: string;
  sessionId?: string;
  productId?: string;
  searchQuery?: string;
  category?: string;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

export interface AnalyticsDashboard {
  totalEvents: number;
  totalUsers: number;
  popularProducts: Array<{ productId: string; count: number }>;
  popularSearches: Array<{ query: string; count: number }>;
  categoryBreakdown: Record<string, number>;
}

export const analyticsService = {
  // Track analytics event
  trackEvent: async (event: AnalyticsEvent): Promise<{ success: boolean }> => {
    const { data } = await apiClient.post('/analytics/track', event);
    return data;
  },

  // Get analytics dashboard
  getDashboard: async (): Promise<{ success: boolean; data: AnalyticsDashboard }> => {
    const { data } = await apiClient.get('/analytics/dashboard');
    return data;
  },

  // Convenience methods for common events
  trackProductView: async (productId: string, userId?: string) => {
    return analyticsService.trackEvent({
      eventType: 'product_view',
      productId,
      userId,
      timestamp: new Date().toISOString(),
    });
  },

  trackSearchQuery: async (searchQuery: string, userId?: string) => {
    return analyticsService.trackEvent({
      eventType: 'search',
      searchQuery,
      userId,
      timestamp: new Date().toISOString(),
    });
  },

  trackChatMessage: async (message: string, sessionId?: string) => {
    return analyticsService.trackEvent({
      eventType: 'chat_message',
      sessionId,
      metadata: { messageLength: message.length },
      timestamp: new Date().toISOString(),
    });
  },

  trackCategoryView: async (category: string, userId?: string) => {
    return analyticsService.trackEvent({
      eventType: 'category_view',
      category,
      userId,
      timestamp: new Date().toISOString(),
    });
  },
};
