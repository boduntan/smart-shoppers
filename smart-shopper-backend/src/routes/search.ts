import { Router, Request, Response } from 'express';
import { chromaService } from '../services/chromaService';
import { logger } from '../utils/logger';

const router = Router();

interface SearchQuery {
  q: string;
  limit?: number;
  vendor?: string;
  minPrice?: number;
  maxPrice?: number;
}

/**
 * @route POST /api/search/semantic
 * @desc Semantic search for products using vector similarity
 * @body { q: string, limit?: number, vendor?: string, minPrice?: number, maxPrice?: number }
 */
router.post('/semantic', async (req: Request, res: Response) => {
  try {
    const { q: query, limit = 10, vendor, minPrice, maxPrice }: SearchQuery = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        error: 'Query parameter "q" is required and cannot be empty'
      });
    }

    // Build filters
    const filters: any = {};
    
    if (vendor) {
      filters.vendor = vendor;
    }
    
    if (minPrice !== undefined && maxPrice !== undefined) {
      filters.priceRange = { min: minPrice, max: maxPrice };
    }

    // Perform semantic search
    const results = await chromaService.searchProducts(
      query.trim(),
      Math.min(limit, 50), // Limit to max 50 results
      Object.keys(filters).length > 0 ? filters : undefined
    );

    logger.info(`Semantic search for "${query}" returned ${results.products.length} results`);

    res.json({
      success: true,
      query,
      results: results.products,
      total: results.total,
      filters: filters
    });

  } catch (error) {
    logger.error('Semantic search failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform semantic search',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/search/similar/:productId
 * @desc Find products similar to a given product
 * @params productId: string
 * @query limit?: number
 */
router.get('/similar/:productId', async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 5, 20);

    if (!productId) {
      return res.status(400).json({
        error: 'Product ID is required'
      });
    }

    const similarProducts = await chromaService.getSimilarProducts(productId, limit);

    logger.info(`Found ${similarProducts.length} similar products for ${productId}`);

    res.json({
      success: true,
      productId,
      similarProducts,
      count: similarProducts.length
    });

  } catch (error) {
    logger.error('Similar products search failed:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to find similar products',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/search/stats
 * @desc Get vector database statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await chromaService.getCollectionStats();
    
    res.json({
      success: true,
      stats
    });

  } catch (error) {
    logger.error('Failed to get search stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve search statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/search/test
 * @desc Test semantic search with sample queries
 */
router.post('/test', async (req: Request, res: Response) => {
  try {
    const testQueries = [
      'office chair ergonomic',
      'printer ink cartridge',
      'desk lamp LED',
      'notebook paper lined',
      'stapler heavy duty'
    ];

    const results = [];

    for (const query of testQueries) {
      try {
        const searchResult = await chromaService.searchProducts(query, 3);
        results.push({
          query,
          success: true,
          results: searchResult.products.slice(0, 3),
          count: searchResult.products.length
        });
      } catch (error) {
        results.push({
          query,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          count: 0
        });
      }
    }

    res.json({
      success: true,
      testResults: results,
      totalQueries: testQueries.length
    });

  } catch (error) {
    logger.error('Search test failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run search tests',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
