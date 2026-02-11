import { apiClient } from './apiClient';

export interface FAQSearchParams {
  q: string;
  limit?: number;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords?: string[];
  url?: string;
  lastUpdated?: string;
}

export interface FAQCategory {
  name: string;
  count: number;
  description?: string;
}

export interface RAGData {
  id: string;
  content: string;
  metadata: {
    category: string;
    context: string;
    relatedTopics: string[];
    priority: number;
    keywords: string[];
    url?: string;
    lastUpdated?: string;
  };
}

export interface FAQSearchResponse {
  success: boolean;
  data: {
    results: FAQ[];
    total: number;
  };
}

export interface RAGSearchResponse {
  success: boolean;
  data: {
    ragData: RAGData[];
    total: number;
    optimizedForAI: boolean;
  };
}

export interface CategoriesResponse {
  success: boolean;
  data: {
    categories: FAQCategory[];
  };
}

export const faqService = {
  // Search FAQs
  searchFAQs: async (params: FAQSearchParams): Promise<FAQSearchResponse> => {
    const { data } = await apiClient.get<FAQSearchResponse>('/faq/search', { params });
    return data;
  },

  // Get all FAQ categories
  getCategories: async (): Promise<CategoriesResponse> => {
    const { data } = await apiClient.get<CategoriesResponse>('/faq/categories');
    return data;
  },

  // Get FAQs by category
  getFAQsByCategory: async (categoryId: string): Promise<FAQSearchResponse> => {
    const { data } = await apiClient.get<FAQSearchResponse>(`/faq/category/${categoryId}`);
    return data;
  },

  // Get specific FAQ by ID
  getFAQById: async (id: string): Promise<{ success: boolean; data: FAQ }> => {
    const { data } = await apiClient.get(`/faq/${id}`);
    return data;
  },

  // RAG-optimized FAQ search (for AI integration)
  searchRAG: async (params: FAQSearchParams): Promise<RAGSearchResponse> => {
    const { data } = await apiClient.get<RAGSearchResponse>('/faq/rag', { params });
    return data;
  },

  // Get FAQ contexts for vector embedding
  getContexts: async (): Promise<{ success: boolean; data: { contexts: RAGData[] } }> => {
    const { data } = await apiClient.get('/faq/contexts');
    return data;
  },

  // Get FAQ context for chat integration
  getChatContext: async (payload: {
    message: string;
    conversationHistory?: Array<{ role: string; content: string }>;
  }): Promise<{ success: boolean; data: { faqs: FAQ[] } }> => {
    const { data } = await apiClient.post('/faq/chat-context', payload);
    return data;
  },
};
