import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

interface ProductSearchOptions {
  query?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  offset?: number;
}

interface SearchResult {
  id: string;
  name: string;
  description: string;
  brand?: string;
  category?: string;
  price?: number;
  relevanceScore?: number;
}

export class PostgresSearchService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async searchProducts(options: ProductSearchOptions): Promise<SearchResult[]> {
    const {
      query,
      category,
      brand,
      minPrice,
      maxPrice,
      limit = 20,
      offset = 0
    } = options;

    try {
      // Build WHERE conditions
      const conditions: any[] = [];
      
      if (query) {
        // PostgreSQL full-text search
        conditions.push(`to_tsvector('english', name || ' ' || description) @@ plainto_tsquery('${query}')`);
      }
      
      if (category) {
        conditions.push(`category ILIKE '%${category}%'`);
      }
      
      if (brand) {
        conditions.push(`brand ILIKE '%${brand}%'`);
      }
      
      if (minPrice !== undefined) {
        conditions.push(`price >= ${minPrice}`);
      }
      
      if (maxPrice !== undefined) {
        conditions.push(`price <= ${maxPrice}`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      
      const orderBy = query 
        ? `ORDER BY ts_rank(to_tsvector('english', name || ' ' || description), plainto_tsquery('${query}')) DESC`
        : 'ORDER BY name ASC';

      // Raw SQL query for full-text search with ranking
      const sql = `
        SELECT 
          id,
          name,
          description,
          brand,
          category,
          price,
          ${query ? `ts_rank(to_tsvector('english', name || ' ' || description), plainto_tsquery('${query}')) as relevance_score` : '0 as relevance_score'}
        FROM "Product"
        ${whereClause}
        ${orderBy}
        LIMIT ${limit} OFFSET ${offset}
      `;

      const results = await this.prisma.$queryRawUnsafe(sql);
      
      logger.info(`Found ${Array.isArray(results) ? results.length : 0} products for query: "${query}"`);
      
      return (results as any[]).map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        brand: row.brand,
        category: row.category,
        price: row.price,
        relevanceScore: parseFloat(row.relevance_score) || 0
      }));

    } catch (error) {
      logger.error('Error in product search:', error);
      throw error;
    }
  }

  async getPopularProducts(limit: number = 10): Promise<SearchResult[]> {
    try {
      const products = await this.prisma.product.findMany({
        take: limit,
        orderBy: {
          createdAt: 'desc'
        }
      });

      return products.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description || '',
        brand: product.brand,
        category: product.category,
        price: product.price?.toNumber()
      }));
    } catch (error) {
      logger.error('Error fetching popular products:', error);
      throw error;
    }
  }

  async createSearchIndex(): Promise<void> {
    try {
      // Create full-text search index
      await this.prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_products_fulltext 
        ON "Product" USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')))
      `;
      
      // Create price index for range queries
      await this.prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_products_price 
        ON "Product" (price) WHERE price IS NOT NULL
      `;
      
      // Create category index
      await this.prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_products_category 
        ON "Product" (category) WHERE category IS NOT NULL
      `;

      logger.info('Search indexes created successfully');
    } catch (error) {
      logger.error('Error creating search indexes:', error);
      throw error;
    }
  }
}

export default PostgresSearchService;
