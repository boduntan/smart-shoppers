import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { vectorService } from '../services/vectorService';
import ProductIngestionService from '../services/productIngestionService';

const router = Router();
const prisma = new PrismaClient();
const ingestionService = new ProductIngestionService(prisma);

// Get products with search and filters
router.get('/', [
  query('q').optional().isString().trim(),
  query('category').optional().isString().trim(),
  query('brand').optional().isString().trim(),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('sortBy').optional().isIn(['name', 'price', 'createdAt']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      q: searchQuery,
      category,
      brand,
      minPrice,
      maxPrice,
      page = 1,
      limit = 20,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query as any;

    // Build where conditions
    const whereConditions: any = {};
    
    if (category) {
      whereConditions.category = {
        contains: category,
        mode: 'insensitive'
      };
    }
    
    if (brand) {
      whereConditions.brand = {
        contains: brand,
        mode: 'insensitive'
      };
    }
    
    if (minPrice || maxPrice) {
      whereConditions.price = {};
      if (minPrice) whereConditions.price.gte = parseFloat(minPrice);
      if (maxPrice) whereConditions.price.lte = parseFloat(maxPrice);
    }

    // Add search condition
    if (searchQuery) {
      whereConditions.OR = [
        {
          name: {
            contains: searchQuery,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: searchQuery,
            mode: 'insensitive'
          }
        }
      ];
    }

    const skip = (page - 1) * limit;
    const orderBy = { [sortBy]: sortOrder };

    // Get products and count
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          name: true,
          description: true,
          brand: true,
          category: true,
          price: true,
          sku: true,
          inStock: true,
          imageUrl: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.product.count({
        where: whereConditions
      })
    ]);

    // If search query provided, also try vector search
    let vectorResults: any[] = [];
    if (searchQuery) {
      try {
        vectorResults = await vectorService.searchProducts(searchQuery, limit);
      } catch (error) {
        logger.warn('Vector search failed:', error);
      }
    }

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      success: true,
      data: {
        products: products.map(product => ({
          ...product,
          price: product.price?.toNumber()
        })),
        vectorResults: vectorResults.length > 0 ? vectorResults : undefined,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products'
    });
  }
});

// POST /api/products/search - Enhanced search with body parameters
router.post('/search', [
  body('query').optional().isString().trim(),
  body('filters').optional().isObject(),
  body('page').optional().isInt({ min: 1 }),
  body('limit').optional().isInt({ min: 1, max: 100 }),
  body('useVector').optional().isBoolean()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { query: searchQuery, filters = {}, page = 1, limit = 20, useVector = false } = req.body;

    let results;
    
    if (useVector && searchQuery) {
      // Use vector search
      results = await vectorService.semanticSearch(searchQuery, filters, limit);
      
      res.json({
        success: true,
        data: {
          products: results,
          searchType: 'vector',
          query: searchQuery,
          total: results.length
        }
      });
    } else {
      // Use traditional database search (redirect to GET method logic)
      const queryParams = new URLSearchParams({
        ...(searchQuery && { q: searchQuery }),
        ...(filters.category && { category: filters.category }),
        ...(filters.brand && { brand: filters.brand }),
        ...(filters.minPrice && { minPrice: filters.minPrice.toString() }),
        ...(filters.maxPrice && { maxPrice: filters.maxPrice.toString() }),
        page: page.toString(),
        limit: limit.toString()
      });

      // Reuse GET logic
      req.query = Object.fromEntries(queryParams);
      return router.handle(req, res);
    }

  } catch (error) {
    logger.error('Error in product search:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed'
    });
  }
});

// Get single product by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: {
        ...product,
        price: product.price?.toNumber()
      }
    });

  } catch (error) {
    logger.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product'
    });
  }
});

// Get product categories
router.get('/meta/categories', async (req: Request, res: Response) => {
  try {
    const categories = await prisma.product.groupBy({
      by: ['category'],
      where: {
        category: { not: null }
      },
      _count: {
        category: true
      },
      orderBy: {
        _count: {
          category: 'desc'
        }
      }
    });

    res.json({
      success: true,
      data: categories.map((item: any) => ({
        name: item.category,
        count: item._count.category
      }))
    });

  } catch (error) {
    logger.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
});

// Get product brands  
router.get('/meta/brands', async (req: Request, res: Response) => {
  try {
    const brands = await prisma.product.groupBy({
      by: ['brand'],
      where: {
        brand: { not: null }
      },
      _count: {
        brand: true
      },
      orderBy: {
        _count: {
          brand: 'desc'
        }
      }
    });

    res.json({
      success: true,
      data: brands.map((item: any) => ({
        name: item.brand,
        count: item._count.brand
      }))
    });

  } catch (error) {
    logger.error('Error fetching brands:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch brands'
    });
  }
});

// Get ingestion stats (admin endpoint)
router.get('/admin/stats', async (req: Request, res: Response) => {
  try {
    const stats = await ingestionService.getIngestionStats();
    
    // Get vector search stats
    let vectorStats;
    try {
      vectorStats = await vectorService.getCollectionStats();
    } catch (error) {
      vectorStats = { count: 0, name: 'unavailable' };
    }

    res.json({
      success: true,
      data: {
        database: stats,
        vectorSearch: vectorStats,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats'
    });
  }
});

export default router;
