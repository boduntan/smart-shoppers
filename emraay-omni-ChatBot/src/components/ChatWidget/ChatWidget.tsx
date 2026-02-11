import { useEffect, useRef } from 'react';
import { useChat } from '@/hooks/useChat';
import { defineCustomElements } from 'staples-hk/loader';
import type { EmraaySmartShopperElement } from '@/types/emraay-smart-shopper';
import './ChatWidget.scss';

defineCustomElements();

export const ChatWidget = () => {
  const chatRef = useRef<EmraaySmartShopperElement>(null);
  const { sendMessage, error } = useChat();

  useEffect(() => {
    const chatElement = chatRef.current;
    if (!chatElement) return;

    const handleMessageSent = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { text, image } = customEvent.detail;

      console.log('📤 User message:', text);
      
      const response = await sendMessage(text, image);

      if (response && chatElement) {
        console.log('📥 Bot response:', response.data.message);
        
        chatElement.addMessage({
          text: response.data.message,
          sender: 'bot',
          timestamp: Date.now(),
          products: response.data.products || [],
        });
      } else if (error) {
        console.error('❌ Chat error:', error);
        
        chatElement.addMessage({
          text: 'Sorry, I encountered an error. Please try again.',
          sender: 'bot',
          timestamp: Date.now(),
        });
      }
    };

    chatElement.addEventListener('messageSent', handleMessageSent);

    return () => {
      chatElement.removeEventListener('messageSent', handleMessageSent);
    };
  }, [sendMessage, error]);

  return (
    <staples-smart-shopper
      ref={chatRef}
      user-id="user-123"
      header-title="Emraay-Solutions Smart Shopper"
      theme-mode="system"
      enable-sound="true"
      max-history-messages="100"
      enable-image-upload="true"
      locale="en-CA"
    />
  );
};
