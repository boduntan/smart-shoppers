import { Router, Request, Response } from 'express';
import { openaiService } from '../services/openaiService';
import { logger } from '../utils/logger';

const router = Router();

// Simple chat endpoint for testing
router.post('/simple', async (req: Request, res: Response): Promise<void> => {
  try {
    const { message } = req.body;

    if (!message) {
      res.status(400).json({
        success: false,
        error: 'Message is required'
      });
      return;
    }

    // Generate AI response without complex history/database for now
    const response = await openaiService.generateChatResponse(message);

    res.json({
      success: true,
      data: {
        userMessage: message,
        aiResponse: response,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Simple chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process message'
    });
  }
});

// Test OpenAI connection
router.get('/test-openai', async (req: Request, res: Response): Promise<void> => {
  try {
    const isConnected = await openaiService.testConnection();
    
    res.json({
      success: true,
      data: {
        connected: isConnected,
        message: isConnected ? 'OpenAI API working!' : 'OpenAI API connection failed'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to test OpenAI connection'
    });
  }
});

export default router;
