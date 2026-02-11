import { Router, Request, Response } from 'express';
import { openaiService } from '../services/openaiService';
import { prismaClient } from '../config/database';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Enhanced chat with conversation continuity
router.post('/conversation', async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, sessionId } = req.body;

    if (!message) {
      res.status(400).json({
        success: false,
        error: 'Message is required'
      });
      return;
    }

    // Generate session ID if not provided
    const currentSessionId = sessionId || uuidv4();

    // Get conversation history (last 10 messages for context)
    const conversationHistory = await prismaClient.chatMessage.findMany({
      where: { sessionId: currentSessionId },
      orderBy: { createdAt: 'asc' },
      take: 10
    });

    // Convert to OpenAI format
    const historyMessages = conversationHistory.map((conv: any) => ({
      role: conv.role as 'user' | 'assistant',
      content: conv.content
    }));

    // Save user message
    await prismaClient.chatMessage.create({
      data: {
        sessionId: currentSessionId,
        role: 'user',
        content: message
      }
    });

    // Generate AI response with conversation context
    const aiResponse = await openaiService.generateContextualResponse(
      message, 
      historyMessages
    );

    // Save AI response
    await prismaClient.chatMessage.create({
      data: {
        sessionId: currentSessionId,
        role: 'assistant',
        content: aiResponse
      }
    });

    res.json({
      success: true,
      data: {
        sessionId: currentSessionId,
        userMessage: message,
        aiResponse: aiResponse,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Conversation chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get conversation history
router.get('/history/:sessionId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
      return;
    }

    const messages = await prismaClient.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' }
    });

    res.json({
      success: true,
      data: {
        sessionId,
        messages: messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.createdAt
        }))
      }
    });

  } catch (error) {
    logger.error('Get conversation history error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Clear conversation
router.delete('/conversation/:sessionId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
      return;
    }

    await prismaClient.chatMessage.deleteMany({
      where: { sessionId }
    });

    res.json({
      success: true,
      data: {
        message: 'Conversation cleared',
        sessionId
      }
    });

  } catch (error) {
    logger.error('Clear conversation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
