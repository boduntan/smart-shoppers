import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// Get products by category
router.get('/category/:categoryName', async (req: Request, res: Response): Promise<void> => {
  try {
    const categoryName = req.params.categoryName;
    if (!categoryName) {
      res.status(400).json({ success: false, error: 'Category name is required' });
      return;
    }
    const { page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100);
    const offset = (pageNum - 1) * limitNum;

    // Map frontend category names to backend categories/vendors
    const categoryMapping: Record<string, any> = {
      'tech-electronics': {
        OR: [
          { category: { contains: 'Electronics', mode: 'insensitive' } },
          { category: { contains: 'Technology', mode: 'insensitive' } },
          { category: { contains: 'Computer', mode: 'insensitive' } },
          { title: { contains: 'laptop', mode: 'insensitive' } },
          { title: { contains: 'computer', mode: 'insensitive' } },
          { title: { contains: 'tablet', mode: 'insensitive' } },
          { title: { contains: 'monitor', mode: 'insensitive' } },
          { title: { contains: 'printer', mode: 'insensitive' } },
          { title: { contains: 'mouse', mode: 'insensitive' } },
          { title: { contains: 'keyboard', mode: 'insensitive' } }
        ]
      },
      'office-supplies': {
        OR: [
          { category: { contains: 'Office', mode: 'insensitive' } },
          { title: { contains: 'pen', mode: 'insensitive' } },
          { title: { contains: 'paper', mode: 'insensitive' } },
          { title: { contains: 'notebook', mode: 'insensitive' } },
          { title: { contains: 'binder', mode: 'insensitive' } },
          { title: { contains: 'stapler', mode: 'insensitive' } }
        ]
      },
      'furniture': {
        OR: [
          { category: { contains: 'Furniture', mode: 'insensitive' } },
          { title: { contains: 'chair', mode: 'insensitive' } },
          { title: { contains: 'desk', mode: 'insensitive' } },
          { title: { contains: 'table', mode: 'insensitive' } },
          { title: { contains: 'cabinet', mode: 'insensitive' } }
        ]
      }
    };

    const whereClause = categoryMapping[categoryName.toLowerCase()] || {
      category: { contains: categoryName, mode: 'insensitive' }
    };

    // Get total count
    const totalCount = await prisma.product.count({
      where: whereClause
    });

    // Get products
    const products = await prisma.product.findMany({
      where: whereClause,
      skip: offset,
      take: limitNum,
      select: {
        id: true,
        title: true,
        vendor: true,
        category: true,
        price: true,
        inStock: true,
        url: true,
        images: true
      },
      orderBy: [
        { inStock: 'desc' },
        { title: 'asc' }
      ]
    });

    const totalPages = Math.ceil(totalCount / limitNum);

    res.json({
      success: true,
      data: {
        products: products.map(product => ({
          ...product,
          price: product.price ? parseFloat(product.price.toString()) : null
        })),
        pagination: {
          total: totalCount,
          page: pageNum,
          limit: limitNum,
          pages: totalPages
        },
        category: categoryName
      }
    });

  } catch (error) {
    logger.error('Get products by category error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get available categories
router.get('/categories/list', async (req: Request, res: Response): Promise<void> => {
  try {
    // Get unique categories from database
    const categories = await prisma.product.groupBy({
      by: ['category'],
      where: {
        category: { not: null }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 20
    });

    // Predefined categories with counts
    const predefinedCategories = [
      {
        name: 'Tech & Electronics',
        slug: 'tech-electronics',
        count: await prisma.product.count({
          where: {
            OR: [
              { title: { contains: 'laptop', mode: 'insensitive' } },
              { title: { contains: 'computer', mode: 'insensitive' } },
              { title: { contains: 'tablet', mode: 'insensitive' } },
              { title: { contains: 'monitor', mode: 'insensitive' } },
              { title: { contains: 'printer', mode: 'insensitive' } }
            ]
          }
        })
      },
      {
        name: 'Office Supplies',
        slug: 'office-supplies',
        count: await prisma.product.count({
          where: {
            OR: [
              { title: { contains: 'pen', mode: 'insensitive' } },
              { title: { contains: 'paper', mode: 'insensitive' } },
              { title: { contains: 'notebook', mode: 'insensitive' } }
            ]
          }
        })
      },
      {
        name: 'Furniture',
        slug: 'furniture',
        count: await prisma.product.count({
          where: {
            OR: [
              { title: { contains: 'chair', mode: 'insensitive' } },
              { title: { contains: 'desk', mode: 'insensitive' } }
            ]
          }
        })
      }
    ];

    res.json({
      success: true,
      data: {
        predefined: predefinedCategories,
        database: categories.map(cat => ({
          name: cat.category,
          count: cat._count.id
        }))
      }
    });

  } catch (error) {
    logger.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
