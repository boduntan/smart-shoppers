import * as fs from 'fs';
import csv from 'csv-parser';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { vectorService } from '../services/vectorService';

interface StaplesCSVRow {
  // Actual CSV column names from Staples CSV
  'Title'?: string;
  'Body HTML'?: string;
  'Vendor'?: string;
  'URL'?: string;
  // Handle any additional columns
  [key: string]: string | undefined;
}

interface ProductData {
  id: string;
  title: string;          // Using 'title' to match Prisma schema
  bodyHtml?: string | undefined;      // Using 'bodyHtml' to match Prisma schema
  vendor: string;         // Using 'vendor' to match Prisma schema
  url?: string | undefined;
  category?: string | undefined;
  price?: number | undefined;
  inStock?: boolean | undefined;
  images?: string[] | undefined;
  specifications?: any;
}

export class ProductIngestionService {
  private prisma: PrismaClient;
  private batchSize = 100;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async ingestCSV(filePath: string): Promise<{ success: number; errors: number }> {
    logger.info(`Starting CSV ingestion from: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`CSV file not found: ${filePath}`);
    }

    let processedCount = 0;
    let errorCount = 0;
    let batch: ProductData[] = [];

    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', async (row: StaplesCSVRow) => {
          try {
            const product = this.transformCSVRow(row);
            if (product) {
              batch.push(product);
              
              // Process in batches
              if (batch.length >= this.batchSize) {
                await this.processBatch([...batch]);
                processedCount += batch.length;
                batch = [];
                
                if (processedCount % 1000 === 0) {
                  logger.info(`Processed ${processedCount} products...`);
                }
              }
            }
          } catch (error) {
            errorCount++;
            logger.warn('Error processing row:', error);
          }
        })
        .on('end', async () => {
          try {
            // Process remaining batch
            if (batch.length > 0) {
              await this.processBatch(batch);
              processedCount += batch.length;
            }
            
            logger.info(`CSV ingestion completed: ${processedCount} products processed, ${errorCount} errors`);
            resolve({ success: processedCount, errors: errorCount });
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error: any) => {
          logger.error('CSV parsing error:', error);
          reject(error);
        });
    });
  }

  private transformCSVRow(row: StaplesCSVRow): ProductData | null {
    try {
      // Extract from actual CSV columns
      const title = row['Title'];
      const bodyHtml = row['Body HTML'];  
      const vendor = row['Vendor'];
      const url = row['URL'];

      if (!title || !vendor) {
        logger.warn('Skipping row: missing required fields (title or vendor)');
        return null;
      }

      // Generate a unique ID from title and vendor if not provided
      const id = `${vendor.toLowerCase().replace(/\s+/g, '-')}-${title.toLowerCase().replace(/\s+/g, '-').substring(0, 50)}`;

      return {
        id,
        title: title.trim(),
        bodyHtml: bodyHtml?.trim() || undefined,
        vendor: vendor.trim(),
        url: url?.trim() || undefined,
        category: undefined,  // Not in CSV, set to undefined
        price: undefined,     // Not in CSV, set to undefined
        inStock: true,        // Default to true since not in CSV
        images: [],           // Empty array since not in CSV
        specifications: {
          // Store any additional CSV columns as specifications
          ...Object.fromEntries(
            Object.entries(row).filter(([key, value]) => 
              !['Title', 'Body HTML', 'Vendor', 'URL'].includes(key) && 
              value !== undefined && value !== ''
            )
          )
        }
      };
    } catch (error) {
      logger.error('Error transforming CSV row:', error);
      return null;
    }
  }

  private async processBatch(products: ProductData[]): Promise<void> {
    try {
      // Insert/update products in database
      await this.insertProductsBatch(products);
      
      // Add to vector store for semantic search
      await this.addToVectorStore(products);
      
    } catch (error) {
      logger.error('Error processing batch:', error);
      throw error;
    }
  }

  private async insertProductsBatch(products: ProductData[]): Promise<void> {
    try {
      // Use upsert for handling duplicates
      const operations = products.map(product => 
        this.prisma.product.upsert({
          where: { id: product.id },
          update: {
            title: product.title,
            bodyHtml: product.bodyHtml ?? null,
            vendor: product.vendor,
            url: product.url ?? null,
            category: product.category ?? null,
            price: product.price ?? null,
            inStock: product.inStock ?? true,
            images: product.images ?? [],
            specifications: product.specifications ?? {},
            updatedAt: new Date()
          },
          create: {
            id: product.id,
            title: product.title,
            bodyHtml: product.bodyHtml ?? null,
            vendor: product.vendor,
            url: product.url ?? `https://staples.ca/product/${product.id}`,
            category: product.category ?? null,
            price: product.price ?? null,
            inStock: product.inStock ?? true,
            images: product.images ?? [],
            specifications: product.specifications ?? {}
          }
        })
      );

      await this.prisma.$transaction(operations);
    } catch (error) {
      logger.error('Error inserting products batch:', error);
      throw error;
    }
  }

  private async addToVectorStore(products: ProductData[]): Promise<void> {
    try {
      const vectorProducts = products.map(product => ({
        id: product.id,
        name: product.title,
        description: product.bodyHtml || '',
        brand: product.vendor,
        category: product.category || 'General',
        price: product.price || 0,  // Default to 0 if undefined
        metadata: product.specifications
      }));

      await vectorService.addProducts(vectorProducts);
    } catch (error) {
      logger.warn('Could not add products to vector store:', error);
      // Don't throw - vector search is optional
    }
  }

  async getIngestionStats(): Promise<{
    totalProducts: number;
    categories: string[];
    vendors: string[];
    priceRange: { min?: number; max?: number };
  }> {
    try {
      const [
        totalProducts,
        categories,
        vendors,
        priceStats
      ] = await Promise.all([
        this.prisma.product.count(),
        this.prisma.product.groupBy({
          by: ['category'],
          where: { category: { not: null } },
          _count: true,
          orderBy: { _count: { category: 'desc' } },
          take: 20
        }),
        this.prisma.product.groupBy({
          by: ['vendor'],
          where: { vendor: { not: null } },
          _count: true,
          orderBy: { _count: { vendor: 'desc' } },
          take: 20
        }),
        this.prisma.product.aggregate({
          _min: { price: true },
          _max: { price: true },
          where: { price: { not: null } }
        })
      ]);

      return {
        totalProducts,
        categories: categories.map((c: any) => c.category!),
        vendors: vendors.map((v: any) => v.vendor!),
        priceRange: {
          min: priceStats._min.price?.toNumber(),
          max: priceStats._max.price?.toNumber()
        }
      };
    } catch (error) {
      logger.error('Error getting ingestion stats:', error);
      throw error;
    }
  }
}

export default ProductIngestionService;
