import { useState } from 'react';
import { chatService } from '@/services/chatService';
import { logger } from '@/utils/logger';
import './ChatTester.scss';

export const ChatTester = () => {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const testMessages = [
    'Hello, can you help me find office chairs?',
    'Show me laptops under $1000',
    'I need pens and notebooks for school',
    'What printers do you recommend?',
  ];

  const handleSendMessage = async (msg: string) => {
    setLoading(true);
    setResponse(null);

    try {
      const result = await chatService.sendMessage({
        message: msg,
        sessionId: sessionId || undefined,
      });

      setResponse(result.data.message);
      if (result.data.sessionId) {
        setSessionId(result.data.sessionId);
      }
      logger.success('Chat response received', result);
    } catch (error) {
      setResponse('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
      logger.error('Chat test failed', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-tester">
      <h3>🧪 Backend Chat Integration Tester</h3>

      <div className="chat-tester__quick-tests">
        <p>Quick test messages:</p>
        {testMessages.map((msg, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(msg)}
            disabled={loading}
            className="chat-tester__test-btn"
          >
            {msg}
          </button>
        ))}
      </div>

      <div className="chat-tester__custom">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          onKeyPress={(e) => e.key === 'Enter' && !loading && handleSendMessage(message)}
          disabled={loading}
        />
        <button
          onClick={() => handleSendMessage(message)}
          disabled={loading || !message.trim()}
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>

      {sessionId && (
        <div className="chat-tester__session">
          Session ID: <code>{sessionId}</code>
        </div>
      )}

      {response && (
        <div className="chat-tester__response">
          <strong>Response:</strong>
          <p>{response}</p>
        </div>
      )}
    </div>
  );
};
