import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

interface BasicSearchQuery {
  q: string;
  limit?: number;
  vendor?: string;
  minPrice?: number;
  maxPrice?: number;
}

/**
 * @route POST /api/search/basic
 * @desc Basic text search for products using PostgreSQL
 * @body { q: string, limit?: number, vendor?: string, minPrice?: number, maxPrice?: number }
 */
router.post('/basic', async (req: Request, res: Response) => {
  try {
    const { q: query, limit = 10, vendor, minPrice, maxPrice }: BasicSearchQuery = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        error: 'Query parameter "q" is required and cannot be empty'
      });
    }

    // Build search conditions
    const whereConditions: any = {
      OR: [
        { title: { contains: query.trim(), mode: 'insensitive' } },
        { description: { contains: query.trim(), mode: 'insensitive' } },
        { vendor: { contains: query.trim(), mode: 'insensitive' } }
      ]
    };

    // Add filters
    const additionalFilters: any[] = [];
    
    if (vendor) {
      additionalFilters.push({ vendor: { equals: vendor, mode: 'insensitive' } });
    }
    
    if (minPrice !== undefined && maxPrice !== undefined) {
      additionalFilters.push({ 
        price: { 
          gte: minPrice,
          lte: maxPrice
        }
      });
    }

    // Combine search with filters
    const finalWhere = additionalFilters.length > 0 
      ? { AND: [whereConditions, ...additionalFilters] }
      : whereConditions;

    const products = await prisma.product.findMany({
      where: finalWhere,
      take: Math.min(limit, 50), // Limit to max 50 results
      select: {
        id: true,
        title: true,
        description: true,
        vendor: true,
        price: true,
        url: true,
        inStock: true
      }
    });

    logger.info(`Basic search for "${query}" returned ${products.length} results`);

    res.json({
      success: true,
      query,
      results: products.map(p => ({
        ...p,
        price: p.price ? Number(p.price) : null
      })),
      total: products.length,
      searchType: 'basic'
    });

  } catch (error) {
    logger.error('Basic search failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform search',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/search/vendors
 * @desc Get list of all vendors with product counts
 */
router.get('/vendors', async (req: Request, res: Response) => {
  try {
    const vendors = await prisma.product.groupBy({
      by: ['vendor'],
      _count: {
        vendor: true
      },
      orderBy: {
        _count: {
          vendor: 'desc'
        }
      }
    });

    const vendorList = vendors.map(v => ({
      name: v.vendor,
      count: v._count.vendor
    }));

    res.json({
      success: true,
      vendors: vendorList,
      total: vendors.length
    });

  } catch (error) {
    logger.error('Failed to get vendors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve vendors',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/search/stats
 * @desc Get search system statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const totalProducts = await prisma.product.count();
    const vendorCount = await prisma.product.groupBy({
      by: ['vendor']
    });

    res.json({
      success: true,
      stats: {
        totalProducts,
        totalVendors: vendorCount.length,
        searchType: 'postgresql_basic',
        features: ['text_search', 'vendor_filter', 'price_filter']
      }
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
 * @desc Test search with sample queries
 */
router.post('/test', async (req: Request, res: Response) => {
  try {
    const testQueries = [
      'office chair',
      'printer',
      'desk',
      'notebook',
      'stapler'
    ];

    const results = [];

    for (const query of testQueries) {
      try {
        const products = await prisma.product.findMany({
          where: {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } }
            ]
          },
          take: 3,
          select: {
            id: true,
            title: true,
            vendor: true,
            price: true
          }
        });

        results.push({
          query,
          success: true,
          results: products.map(p => ({
            ...p,
            price: p.price ? Number(p.price) : null
          })),
          count: products.length
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
