import { useContext } from 'react';
import { ChatContext, ChatContextType } from '@/context/ChatContext';

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
};
