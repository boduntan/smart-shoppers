import { createContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { chatService, ChatResponse } from '@/services/chatService';
import { imageService } from '@/services/imageService';
import { logger } from '@/utils/logger';

export interface ChatContextType {
  sessionId: string | null;
  isLoading: boolean;
  error: string | null;
  sendMessage: (message: string, image?: File) => Promise<ChatResponse | null>;
  clearError: () => void;
  clearSession: () => void;
  loadHistory: () => Promise<void>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load session from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('chatSessionId');
    if (savedSession) {
      setSessionId(savedSession);
      logger.info('Loaded session from localStorage', savedSession);
    }
  }, []);

  const sendMessage = useCallback(
    async (message: string, image?: File): Promise<ChatResponse | null> => {
      setIsLoading(true);
      setError(null);

      try {
        let response: ChatResponse;

        if (image) {
          // Handle image upload
          logger.info('Uploading image with message', message);
          const imageResponse = await imageService.uploadImageChat(image, message, sessionId || undefined);
          // Map image response to chat response format
          response = {
            success: imageResponse.success,
            data: {
              message: imageResponse.data.userMessage,
              sessionId: imageResponse.data.sessionId,
              aiResponse: imageResponse.data.aiResponse,
              timestamp: imageResponse.data.timestamp,
              products: [],
            },
          };
        } else {
          // Handle text message
          logger.info('Sending text message', message);
          response = await chatService.sendMessage({
            message,
            sessionId: sessionId || undefined,
          });
        }

        if (response.data.sessionId) {
          setSessionId(response.data.sessionId);
          localStorage.setItem('chatSessionId', response.data.sessionId);
        }

        logger.success('Message sent successfully', response);
        return response;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
        setError(errorMessage);
        logger.error('Failed to send message', err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearSession = useCallback(async () => {
    if (sessionId) {
      try {
        await chatService.clearConversation(sessionId);
        logger.info('Session cleared', sessionId);
      } catch (err) {
        logger.error('Failed to clear session', err);
      }
    }
    setSessionId(null);
    localStorage.removeItem('chatSessionId');
  }, [sessionId]);

  const loadHistory = useCallback(async () => {
    if (!sessionId) return;

    try {
      const history = await chatService.getChatHistory(sessionId);
      logger.info('Loaded conversation history', history);
    } catch (err) {
      logger.error('Failed to load history', err);
    }
  }, [sessionId]);

  return (
    <ChatContext.Provider
      value={{ sessionId, isLoading, error, sendMessage, clearError, clearSession, loadHistory }}
    >
      {children}
    </ChatContext.Provider>
  );
};
