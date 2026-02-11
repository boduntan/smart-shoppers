import { Router, Request, Response } from 'express';
import { openaiService } from '../services/openaiService';
import { chromaService } from '../services/chromaService';
import { logger } from '../utils/logger';

const router = Router();

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface EnhancedChatRequest {
  message: string;
  sessionId?: string;
  conversationHistory?: ChatMessage[];
  includeProducts?: boolean;
}

/**
 * @route POST /api/chat/enhanced
 * @desc Enhanced AI chat with vector search and product recommendations
 * @body { message: string, sessionId?: string, conversationHistory?: ChatMessage[], includeProducts?: boolean }
 */
router.post('/enhanced', async (req: Request, res: Response) => {
  try {
    const {
      message,
      sessionId,
      conversationHistory = [],
      includeProducts = true
    }: EnhancedChatRequest = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message is required and cannot be empty'
      });
    }

    const trimmedMessage = message.trim();
    logger.info(`Enhanced chat request: "${trimmedMessage}" (Session: ${sessionId || 'none'})`);

    // Generate intelligent response with product search
    const result = await openaiService.generateIntelligentResponse(
      trimmedMessage,
      conversationHistory
    );

    // Format response
    const response = {
      success: true,
      message: result.response,
      sessionId: sessionId || `session_${Date.now()}`,
      timestamp: new Date().toISOString(),
      hasProductResults: !!(result.searchResults && result.searchResults.length > 0),
      productCount: result.searchResults?.length || 0,
      ...(includeProducts && result.searchResults && { products: result.searchResults }),
      ...(result.recommendedProducts && { recommendations: result.recommendedProducts })
    };

    logger.info(`Enhanced chat response generated with ${result.searchResults?.length || 0} products`);

    res.json(response);

  } catch (error) {
    logger.error('Enhanced chat failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process chat message',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/chat/recommendations
 * @desc Get product recommendations based on a query
 * @body { query: string, limit?: number, vendor?: string }
 */
router.post('/recommendations', async (req: Request, res: Response) => {
  try {
    const { query, limit = 5, vendor } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Query is required and cannot be empty'
      });
    }

    // Search for relevant products
    const filters = vendor ? { vendor } : undefined;
    const searchResult = await chromaService.searchProducts(
      query.trim(),
      Math.min(limit * 2, 20), // Search for more to give AI more options
      filters
    );

    if (searchResult.products.length === 0) {
      return res.json({
        success: true,
        query,
        recommendations: [],
        message: "I couldn't find any products matching your query. Please try different keywords.",
        count: 0
      });
    }

    // Generate AI recommendations
    const recommendationText = await openaiService.generateProductRecommendations(
      query,
      searchResult.products,
      limit
    );

    // Get top products for detailed response
    const topProducts = searchResult.products.slice(0, limit);

    logger.info(`Generated ${topProducts.length} product recommendations for "${query}"`);

    res.json({
      success: true,
      query,
      recommendations: topProducts,
      aiSummary: recommendationText,
      count: topProducts.length,
      totalFound: searchResult.products.length
    });

  } catch (error) {
    logger.error('Product recommendations failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate product recommendations',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/chat/compare
 * @desc Compare multiple products and provide AI analysis
 * @body { productIds: string[], question?: string }
 */
router.post('/compare', async (req: Request, res: Response) => {
  try {
    const { productIds, question = 'Compare these products' } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'At least 2 product IDs are required for comparison'
      });
    }

    if (productIds.length > 5) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 5 products can be compared at once'
      });
    }

    // Get similar products for each ID (this will validate they exist)
    const products = [];
    
    for (const productId of productIds) {
      try {
        // Use similar search to get product details
        const similar = await chromaService.getSimilarProducts(productId, 1);
        if (similar.length > 0) {
          products.push(similar[0]);
        }
      } catch (error) {
        logger.warn(`Product ${productId} not found for comparison`);
      }
    }

    if (products.length < 2) {
      return res.status(404).json({
        success: false,
        error: 'Not enough valid products found for comparison'
      });
    }

    // Generate comparison using AI
    const comparisonPrompt = `${question}

Products to compare:
${products.map((p, i) => 
  `${i + 1}. ${p.title} by ${p.vendor} - $${p.price || 'Price available in store'}`
).join('\n')}

Please provide a detailed comparison highlighting the key differences, pros/cons, and which product might be best for different use cases.`;

    const comparison = await openaiService.generateChatResponse(comparisonPrompt, []);

    logger.info(`Generated comparison for ${products.length} products`);

    res.json({
      success: true,
      products,
      comparison,
      productCount: products.length,
      question
    });

  } catch (error) {
    logger.error('Product comparison failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to compare products',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/chat/health
 * @desc Health check for enhanced chat services
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    // Test OpenAI connection
    const openaiStatus = await openaiService.testConnection();
    
    // Test ChromaDB connection
    let chromaStatus = false;
    let chromaStats = null;
    
    try {
      chromaStats = await chromaService.getCollectionStats();
      chromaStatus = true;
    } catch (error) {
      logger.warn('ChromaDB health check failed:', error);
    }

    const isHealthy = openaiStatus && chromaStatus;

    res.status(isHealthy ? 200 : 503).json({
      success: isHealthy,
      services: {
        openai: {
          status: openaiStatus ? 'healthy' : 'unhealthy',
          model: 'gpt-4o-mini'
        },
        chroma: {
          status: chromaStatus ? 'healthy' : 'unhealthy',
          stats: chromaStats
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Enhanced chat health check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
