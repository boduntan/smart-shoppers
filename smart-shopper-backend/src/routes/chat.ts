import { Router } from 'express';
import { Request, Response } from 'express';
import { openaiService } from '../services/openaiService';
import { prismaClient } from '../config/database';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// POST /api/chat/message - Send a message to the AI assistant
router.post('/message', async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, sessionId } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Message is required and must be a string',
      });
    }

    // Generate session ID if not provided
    const currentSessionId = sessionId || uuidv4();

    // Get conversation history from database
    const conversationHistory = await prismaClient.chatMessage.findMany({
      where: { sessionId: currentSessionId },
      orderBy: { createdAt: 'asc' },
      take: 10, // Limit to last 10 messages for context
    });

    // Convert to OpenAI format
    const historyMessages = conversationHistory.map((conv: any) => ({
      role: conv.role as 'user' | 'assistant',
      content: conv.content
    }));

    // Search for relevant products based on the message
    const relevantProducts = await searchRelevantProducts(message);

    // Generate AI response
    const aiResponse = await openaiService.generateChatResponse(
      message,
      historyMessages,
      relevantProducts
    );

    // Save both user message and AI response to conversation history
    await prismaClient.$transaction([
      prismaClient.chatMessage.create({
        data: {
          sessionId: currentSessionId,
          role: 'user',
          content: message,
        }
      }),
      prismaClient.chatMessage.create({
        data: {
          sessionId: currentSessionId,
          role: 'assistant',
          content: aiResponse,
        }
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        response: aiResponse,
        sessionId: currentSessionId,
        relevantProducts: relevantProducts?.slice(0, 3) || [], // Return top 3 relevant products
      },
    });
  } catch (error) {
    logger.error('Chat message error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process chat message',
    });
  }
});

// Helper function to search for relevant products
async function searchRelevantProducts(message: string): Promise<any[]> {
  try {
    // Simple keyword-based product search (can be enhanced with vector search later)
    const keywords = message.toLowerCase().split(' ').filter(word => word.length > 2);
    
    if (keywords.length === 0) return [];

    // Search for products matching keywords in title or vendor
    const products = await prismaClient.product.findMany({
      where: {
        OR: [
          {
            title: {
              contains: keywords.join(' '),
              mode: 'insensitive'
            }
          },
          {
            vendor: {
              in: keywords,
              mode: 'insensitive'
            }
          },
          ...keywords.map(keyword => ({
            title: {
              contains: keyword,
              mode: 'insensitive' as const
            }
          }))
        ]
      },
      take: 5,
      select: {
        id: true,
        title: true,
        vendor: true,
        price: true,
        url: true,
        category: true
      }
    });

    return products;
  } catch (error) {
    logger.warn('Product search error:', error);
    return [];
  }
}

// GET /api/chat/session/:id - Get conversation history
router.get('/session/:id', async (req: Request, res: Response) => {
  try {
    const sessionId = req.params.id;
    
    const conversations = await prismaClient.chatMessage.findMany({
      where: { sessionId: sessionId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true
      }
    });

    res.status(200).json({
      success: true,
      data: {
        sessionId,
        conversations,
        messageCount: conversations.length
      },
    });
  } catch (error) {
    logger.error('Session retrieval error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve session',
    });
  }
});

// DELETE /api/chat/session/:id - Clear conversation history
router.delete('/session/:id', async (req: Request, res: Response) => {
  try {
    const sessionId = req.params.id;
    
    const deletedCount = await prismaClient.chatMessage.deleteMany({
      where: { sessionId: sessionId }
    });

    res.status(200).json({
      success: true,
      data: {
        sessionId,
        deletedMessages: deletedCount.count
      },
    });
  } catch (error) {
    logger.error('Session clearing error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear session',
    });
  }
});

// POST /api/chat/recommend - Get AI product recommendations
router.post('/recommend', async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, limit = 5 } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query is required and must be a string',
      });
    }

    // Search for relevant products
    const products = await searchRelevantProducts(query);

    if (products.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          recommendations: 'I couldn\'t find any products matching your criteria. Could you try different keywords or be more specific?',
          products: []
        }
      });
    }

    // Generate AI recommendations
    const recommendations = await openaiService.generateProductRecommendations(
      query,
      products,
      limit
    );

    res.status(200).json({
      success: true,
      data: {
        query,
        recommendations,
        products: products.slice(0, limit),
        totalFound: products.length
      },
    });
  } catch (error) {
    logger.error('Recommendation error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate recommendations',
    });
  }
});

// GET /api/chat/test - Test OpenAI connection
router.get('/test', async (req: Request, res: Response) => {
  try {
    const isConnected = await openaiService.testConnection();
    
    res.status(200).json({
      success: true,
      data: {
        openaiConnected: isConnected,
        message: isConnected ? 'OpenAI connection successful!' : 'OpenAI connection failed'
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
