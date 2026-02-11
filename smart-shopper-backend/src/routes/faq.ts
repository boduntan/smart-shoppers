import { Router, Request, Response } from 'express';
import faqService from '../services/faqService';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/faq/search - Search FAQ
router.get('/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 10;
    
    logger.info(`FAQ search request: "${query}"`);
    
    const results = await faqService.searchFAQ(query, limit);
    
    res.status(200).json({
      success: true,
      data: {
        results,
        query: query || '',
        total: results.length,
        message: results.length > 0 
          ? `Found ${results.length} FAQ${results.length > 1 ? 's' : ''} matching your query`
          : 'No FAQs found matching your query'
      },
    });
  } catch (error) {
    logger.error('FAQ search error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/faq/categories - Get FAQ categories
router.get('/categories', async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await faqService.getFAQCategories();
    
    res.status(200).json({
      success: true,
      data: {
        categories,
        total: categories.length,
        totalFAQs: await faqService.getTotalFAQCount()
      },
    });
  } catch (error) {
    logger.error('FAQ categories error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/faq/category/:categoryId - Get FAQs by category
router.get('/category/:categoryId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoryId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    
    if (!categoryId) {
      res.status(400).json({
        success: false,
        error: 'Category ID is required'
      });
      return;
    }
    
    const results = await faqService.getFAQByCategory(categoryId, limit);
    
    res.status(200).json({
      success: true,
      data: {
        category: categoryId,
        results,
        total: results.length
      },
    });
  } catch (error) {
    logger.error('FAQ by category error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/faq/rag - Get FAQ data optimized for RAG/AI consumption
router.get('/rag', async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 5;
    
    logger.info(`FAQ RAG request: "${query}"`);
    
    let results;
    if (query) {
      results = await faqService.searchFAQForRAG(query, limit);
    } else {
      results = await faqService.getFAQsForRAG();
    }
    
    // Return in a format optimized for AI/RAG consumption
    const ragData = results.map(faq => ({
      id: faq.id,
      content: `${faq.question}\n\n${faq.answer}`,
      metadata: {
        category: faq.category,
        keywords: faq.keywords,
        context: faq.context,
        relatedTopics: faq.relatedTopics,
        priority: faq.priority,
        url: faq.url,
        lastUpdated: faq.lastUpdated
      }
    }));
    
    res.status(200).json({
      success: true,
      data: {
        ragData,
        query: query || null,
        total: ragData.length,
        optimizedForAI: true,
        message: query 
          ? `Found ${ragData.length} contextually relevant FAQ${ragData.length > 1 ? 's' : ''} for AI processing`
          : `Returning all ${ragData.length} FAQs optimized for RAG consumption`
      },
    });
  } catch (error) {
    logger.error('FAQ RAG error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/faq/contexts - Get FAQ contexts for vector embedding
router.get('/contexts', async (req: Request, res: Response): Promise<void> => {
  try {
    const contexts = await faqService.getFAQContexts();
    
    res.status(200).json({
      success: true,
      data: {
        contexts,
        total: contexts.length,
        vectorReady: true,
        message: `Generated ${contexts.length} context strings for vector embedding`
      },
    });
  } catch (error) {
    logger.error('FAQ contexts error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/faq/:id - Get specific FAQ by ID
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!id) {
      res.status(400).json({
        success: false,
        error: 'FAQ ID is required'
      });
      return;
    }
    
    const faq = await faqService.getFAQById(id);
    
    if (!faq) {
      res.status(404).json({
        success: false,
        error: 'FAQ not found'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: faq
    });
  } catch (error) {
    logger.error('FAQ by ID error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/faq/chat-context - Get FAQ context for chat conversation
router.post('/chat-context', async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, conversationHistory } = req.body;
    
    logger.info(`FAQ chat context request: "${message}"`);
    
    // Enhanced search combining message + conversation context
    const searchTerms = message.toLowerCase();
    const relevantFAQs = await faqService.searchFAQForRAG(searchTerms, 3);
    
    // Format for chatbot consumption
    const contextData = {
      faqs: relevantFAQs.map(faq => ({
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        context: faq.context,
        url: faq.url,
        relevanceScore: faq.priority || 5
      })),
      searchQuery: message,
      conversationContext: conversationHistory?.slice(-3) || [], // Last 3 messages for context
      timestamp: new Date().toISOString()
    };
    
    res.status(200).json({
      success: true,
      data: contextData,
      ragReady: true,
      message: `Found ${relevantFAQs.length} contextually relevant FAQs for chat response generation`
    });
    
  } catch (error) {
    logger.error('FAQ chat context error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
