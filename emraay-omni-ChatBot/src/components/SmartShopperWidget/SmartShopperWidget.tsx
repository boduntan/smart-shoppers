import { useEffect, useRef, useState } from 'react';
import { defineCustomElements } from 'staples-hk/loader';
import { chatService, type ChatResponse } from '@/services/chatService';
import { imageService, type ImageUploadResponse } from '@/services/imageService';
import { productService } from '@/services/productService';
import { useApiHealth } from '@/context/ApiHealthContext';

interface ChatMessage {
  id?: string;
  type?: 'user' | 'ai';
  content: string;
  timestamp?: Date;
  products?: any[];
  metadata?: any;
  choices?: any[];
  imageUrl?: string;
}
import './SmartShopperWidget.scss';

// Define custom element types for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'staples-smart-shopper': any; // web component tag from staples-hk package
    }
  }
}

export const SmartShopperWidget: React.FC = () => {
  const chatRef = useRef<HTMLElement & {
    addMessage: (message: Partial<ChatMessage>) => Promise<void>;
    clearMessages: () => Promise<void>;
    openChat: () => Promise<void>;
    closeChat: () => Promise<void>;
    showTyping: () => Promise<void>;
    hideTyping: () => Promise<void>;
    playSound: (soundName: 'messageSent' | 'messageReceived' | 'choiceSelected' | 'error') => Promise<void>;
  }>(null);
  
  const { isHealthy, apiMode } = useApiHealth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}`);

  useEffect(() => {
    // Initialize web components
    defineCustomElements();
  }, []);

  useEffect(() => {
    const chatComponent = chatRef.current;
    if (!chatComponent) return;

    // Handler for text messages sent from the chat component
    const handleMessageSent = async (event: CustomEvent) => {
      const { message, hasImage, imageData, userId } = event.detail;
      console.log('📤 Message sent:', { message, hasImage, userId });

      if (isProcessing) {
        console.warn('⚠️ Already processing a message, please wait...');
        return;
      }

      setIsProcessing(true);
      
      // Show typing indicator using method
      if (chatComponent?.showTyping) {
        await chatComponent.showTyping();
        console.log('🔄 Typing indicator shown');
      }

      try {
        let response: ChatResponse | ImageUploadResponse;
        let aiMessage: string;
        let products: any[] = [];

        if (hasImage && imageData) {
          // Handle image-based query
          console.log('🖼️ Processing image query...');
          const byteString = atob(imageData.split(',')[1]);
          const mimeString = imageData.split(',')[0].split(':')[1].split(';')[0];
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([ab], { type: mimeString });
          const file = new File([blob], 'image.jpg', { type: mimeString });
          const imageResponse = await imageService.uploadImageChat(file, message, sessionId);
          response = imageResponse;
          aiMessage = imageResponse.data.aiResponse;
        } else {
          // Handle text-based query
          console.log('💬 Processing text query...');
          
          // Try conversation endpoint first, fallback to simple if it fails
          try {
            const chatResponse = await chatService.sendMessage({
              message,
              sessionId
            });
            response = chatResponse;
            aiMessage = chatResponse.data.aiResponse || chatResponse.data.message;
            products = chatResponse.data.products || [];
          } catch (convError: any) {
            console.warn('Conversation endpoint failed, trying simple chat:', convError.message);
            // Fallback to simple chat
            const simpleResponse = await chatService.sendSimpleMessage(message);
            response = simpleResponse;
            aiMessage = simpleResponse.data.aiResponse || simpleResponse.data.message;
            products = simpleResponse.data.products || [];
          }
        }

        console.log('✅ API Response:', response);

        // Hide typing indicator before showing message
        if (chatComponent?.hideTyping) {
          await chatComponent.hideTyping();
          console.log('✅ Typing indicator hidden');
        }

        // Play sound for received message
        if (chatComponent?.playSound) {
          await chatComponent.playSound('messageReceived');
          console.log('🔊 Played messageReceived sound');
        }

        // Add AI response back to chat
        await chatComponent.addMessage({
          content: aiMessage,
          type: 'ai',
          timestamp: new Date(),
          products: products,
          metadata: {
            sessionId,
            source: 'api'
          }
        });

      } catch (error: any) {
        console.error('❌ Error processing message:', error);
        
        // Hide typing on error
        if (chatComponent?.hideTyping) {
          await chatComponent.hideTyping();
        }
        
        // Play error sound
        if (chatComponent?.playSound) {
          await chatComponent.playSound('error');
          console.log('🔊 Played error sound');
        }

        // Add error message to chat
        await chatComponent.addMessage({
          content: apiMode === 'mock' 
            ? 'Mock mode error - this should not happen. Please check console.'
            : `Sorry, I encountered an error: ${error.message}. Please try again.`,
          type: 'ai',
          timestamp: new Date()
        });
      } finally {
        setIsProcessing(false);
      }
    };

    // Handler for suggested prompt selection
    const handleSuggestedPromptSelected = async (event: CustomEvent) => {
      const { prompt } = event.detail;
      console.log('💡 Suggested prompt selected:', prompt);

      if (isProcessing) return;
      setIsProcessing(true);
      
      // Show typing indicator
      if (chatComponent?.showTyping) {
        await chatComponent.showTyping();
      }

      try {
        const response = await chatService.sendMessage({
          message: prompt.text,
          sessionId
        });

        // Hide typing indicator
        if (chatComponent?.hideTyping) {
          await chatComponent.hideTyping();
        }

        // Play sound for received message
        if (chatComponent?.playSound) {
          await chatComponent.playSound('messageReceived');
        }

        await chatComponent.addMessage({
          content: response.data.aiResponse || response.data.message,
          type: 'ai',
          timestamp: new Date(),
          products: response.data.products || []
        });
      } catch (error) {
        console.error('Error with suggested prompt:', error);
        if (chatComponent?.hideTyping) {
          await chatComponent.hideTyping();
        }
        if (chatComponent?.playSound) {
          await chatComponent.playSound('error');
        }
      } finally {
        setIsProcessing(false);
      }
    };

    // Handler for product clicks
    const handleProductClicked = (event: CustomEvent) => {
      const { productId, productName, productUrl } = event.detail;
      console.log('🛍️ Product clicked:', { productId, productName, productUrl });
      
      // Track analytics or navigate
      if (productUrl) {
        window.open(productUrl, '_blank');
      }
    };

    // Handler for chat opened
    const handleChatOpened = (event: CustomEvent) => {
      console.log('📂 Chat opened:', event.detail);
    };

    // Handler for chat closed
    const handleChatClosed = (event: CustomEvent) => {
      console.log('📁 Chat closed:', event.detail);
    };

    // Handler for chat minimized
    const handleChatMinimized = (event: CustomEvent) => {
      console.log('➖ Chat minimized:', event.detail);
    };

    // Handler for chat history loaded
    const handleChatHistoryLoaded = (event: CustomEvent) => {
      const { messageCount, userId } = event.detail;
      console.log(`📚 Chat history loaded: ${messageCount} messages for user ${userId}`);
    };

    // Handler for session started
    const handleSessionStarted = (event: CustomEvent) => {
      const { userId, deviceId, timestamp } = event.detail;
      console.log('🚀 Session started:', { userId, deviceId, timestamp });
    };

    // Handler for image uploaded
    const handleImageUploaded = (event: CustomEvent) => {
      const { imageData, type, timestamp } = event.detail;
      console.log('📸 Image uploaded:', { type, timestamp, dataLength: imageData?.length });
    };

    // Handler for chat error
    const handleChatError = (event: CustomEvent) => {
      const { error, context, timestamp } = event.detail;
      console.error('⚠️ Chat error:', { error, context, timestamp });
    };

    // Handler for choice selection (quick replies)
    const handleChoiceSelected = async (event: CustomEvent) => {
      const { choice } = event.detail;
      console.log('🔘 Choice selected:', choice);

      if (isProcessing) return;
      setIsProcessing(true);
      
      // Play choice selected sound immediately
      if (chatComponent?.playSound) {
        await chatComponent.playSound('choiceSelected');
      }
      
      // Show typing indicator
      if (chatComponent?.showTyping) {
        await chatComponent.showTyping();
      }

      try {
        const response = await chatService.sendMessage({
          message: choice.value,
          sessionId
        });

        // Hide typing indicator
        if (chatComponent?.hideTyping) {
          await chatComponent.hideTyping();
        }

        // Play sound for received message
        if (chatComponent?.playSound) {
          await chatComponent.playSound('messageReceived');
        }

        await chatComponent.addMessage({
          content: response.data.aiResponse || response.data.message,
          type: 'ai',
          timestamp: new Date(),
          products: response.data.products || []
        });
      } catch (error) {
        console.error('Error with choice selection:', error);
        if (chatComponent?.hideTyping) {
          await chatComponent.hideTyping();
        }
        if (chatComponent?.playSound) {
          await chatComponent.playSound('error');
        }
      } finally {
        setIsProcessing(false);
      }
    };

    // Attach event listeners
    chatComponent.addEventListener('messageSent', handleMessageSent as any);
    chatComponent.addEventListener('suggestedPromptSelected', handleSuggestedPromptSelected as any);
    chatComponent.addEventListener('productClicked', handleProductClicked as any);
    chatComponent.addEventListener('chatOpened', handleChatOpened as any);
    chatComponent.addEventListener('chatClosed', handleChatClosed as any);
    chatComponent.addEventListener('chatMinimized', handleChatMinimized as any);
    chatComponent.addEventListener('choiceSelected', handleChoiceSelected as any);
    chatComponent.addEventListener('chatHistoryLoaded', handleChatHistoryLoaded as any);
    chatComponent.addEventListener('sessionStarted', handleSessionStarted as any);
    chatComponent.addEventListener('imageUploaded', handleImageUploaded as any);
    chatComponent.addEventListener('chatError', handleChatError as any);

    // Cleanup
    return () => {
      chatComponent.removeEventListener('messageSent', handleMessageSent as any);
      chatComponent.removeEventListener('suggestedPromptSelected', handleSuggestedPromptSelected as any);
      chatComponent.removeEventListener('productClicked', handleProductClicked as any);
      chatComponent.removeEventListener('chatOpened', handleChatOpened as any);
      chatComponent.removeEventListener('chatClosed', handleChatClosed as any);
      chatComponent.removeEventListener('chatMinimized', handleChatMinimized as any);
      chatComponent.removeEventListener('choiceSelected', handleChoiceSelected as any);
      chatComponent.removeEventListener('chatHistoryLoaded', handleChatHistoryLoaded as any);
      chatComponent.removeEventListener('sessionStarted', handleSessionStarted as any);
      chatComponent.removeEventListener('imageUploaded', handleImageUploaded as any);
      chatComponent.removeEventListener('chatError', handleChatError as any);
    };
  }, [isProcessing, sessionId, apiMode, isHealthy]);

  // Load suggested prompts based on categories
  const [suggestedPrompts, setSuggestedPrompts] = useState<any[]>([]);

  useEffect(() => {
    const loadSuggestedPrompts = async () => {
      try {
        const response = await productService.getCategoriesList();
        const categoryList = response.data?.predefined?.map((cat: any) => cat.name) || [];
        const prompts = categoryList.slice(0, 6).map((cat: string, idx: number) => ({
          id: `prompt-${idx}`,
          text: `Show me ${cat}`,
          icon: '🛍️'
        }));
        setSuggestedPrompts(prompts);
      } catch (error) {
        console.log('Could not load categories for prompts:', error);
        // Set default prompts
        setSuggestedPrompts([
          { id: '1', text: 'Show me office supplies', icon: '📝' },
          { id: '2', text: 'I need ergonomic furniture', icon: '🪑' },
          { id: '3', text: 'Best laptops for work', icon: '💻' },
          { id: '4', text: 'Popular printer models', icon: '🖨️' },
          { id: '5', text: 'Office organization solutions', icon: '📦' },
          { id: '6', text: 'Trending tech products', icon: '⚡' }
        ]);
      }
    };

    if (isHealthy) {
      loadSuggestedPrompts();
    }
  }, [isHealthy]);

  return (
    <div className="smart-shopper-wrapper">
      <staples-smart-shopper
        ref={chatRef}
        user-id="user-demo"
        header-title="Emraay-Solutions Smart Shopper"
        welcome-message="Hi! I'm your AI shopping assistant. How can I help you find the perfect product today?"
        placeholder-text="Ask me anything about products..."
        theme-mode="system"
        enable-sounds="true"
        enable-notifications="true"
        enable-history="true"
        enable-image-upload="true"
        enable-barcode-scanner="false"
        max-history-messages="100"
        locale="en-CA"
        position="bottom-right"
        initially-open="false"
        suggested-prompts={JSON.stringify(suggestedPrompts)}
        max-suggested-prompts="6"
        scroll-button-mobile-only="false"
      />
      
      {!isHealthy && apiMode === 'live' && (
        <div className="health-warning">
          ⚠️ API connection unavailable. Chat may not work properly.
        </div>
      )}
    </div>
  );
};
