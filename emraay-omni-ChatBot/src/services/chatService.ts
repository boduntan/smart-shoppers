import { apiClient } from './apiClient';

export interface ChatMessage {
  message: string;
  sessionId?: string;
}

export interface ChatResponse {
  success: boolean;
  data: {
    message: string;
    sessionId: string;
    aiResponse?: string;
    products?: Product[];
    timestamp?: string;
  };
}

export interface ChatHistoryResponse {
  success: boolean;
  data: {
    sessionId: string;
    messages: Array<{
      role: 'user' | 'assistant';
      content: string;
      timestamp: string;
    }>;
  };
}

export interface Product {
  id: string;
  title: string;
  vendor: string;
  price: number | null;
  inStock: boolean;
  url: string;
  images: string[];
  category?: string;
}

export const chatService = {
  // Send message with conversation memory (RECOMMENDED)
  sendMessage: async (payload: ChatMessage): Promise<ChatResponse> => {
    const { data } = await apiClient.post<ChatResponse>('/chat/conversation', payload);
    return data;
  },

  // Send simple message without conversation memory
  sendSimpleMessage: async (message: string): Promise<ChatResponse> => {
    const { data } = await apiClient.post<ChatResponse>('/chat/simple', { message });
    return data;
  },

  // Get conversation history
  getChatHistory: async (sessionId: string): Promise<ChatHistoryResponse> => {
    const { data } = await apiClient.get<ChatHistoryResponse>(`/chat/history/${sessionId}`);
    return data;
  },

  // Clear conversation
  clearConversation: async (sessionId: string): Promise<{ success: boolean }> => {
    const { data } = await apiClient.delete(`/chat/conversation/${sessionId}`);
    return data;
  },

  // Test OpenAI connection
  testOpenAI: async (): Promise<{ success: boolean; message: string }> => {
    const { data } = await apiClient.get('/chat/test-openai');
    return data;
  },
};
