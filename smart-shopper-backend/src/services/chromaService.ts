import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { OpenAI } from 'openai';

interface ProductEmbedding {
  id: string;
  title: string;
  description: string;
  vendor: string;
  price: number;
  category?: string;
  url?: string;
}

interface SearchResult {
  id: string;
  title: string;
  description: string;
  vendor: string;
  price: number;
  score: number;
  url?: string;
}

class ChromaService {
  private client: any = null;
  private collection: any = null;
  private prisma: PrismaClient;
  private openai: OpenAI;
  private isInitialized: boolean = false;
  private chromaAvailable: boolean = false;

  constructor() {
    this.prisma = new PrismaClient();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async initialize(): Promise<void> {
    try {
      // Import ChromaDB with correct v3.0.0 API
      const { ChromaClient } = await import('chromadb');
      
      // Initialize ChromaDB client
      this.client = new ChromaClient({
        path: process.env.CHROMA_URL || 'http://chroma:8000'
      } as any);

      // Test connection
      await this.client.heartbeat();
      logger.info('ChromaDB connection successful');
      
      // Get or create collection
      this.collection = await this.client.getOrCreateCollection({
        name: 'staples_products'
      });

      this.isInitialized = true;
      this.chromaAvailable = true;
      logger.info('ChromaDB service initialized successfully with v3.0.0 API');
    } catch (error) {
      logger.error('Failed to initialize ChromaDB service:', error);
      logger.info('Falling back to PostgreSQL search only');
      this.isInitialized = true;
      this.chromaAvailable = false;
    }
  }

  async addProductEmbedding(product: ProductEmbedding): Promise<void> {
    if (!this.chromaAvailable || !this.collection) {
      logger.debug(`ChromaDB not available, skipping embedding for product: ${product.title}`);
      return;
    }

    try {
      // Create embedding using OpenAI
      const document = `${product.title} ${product.description} ${product.vendor}`.trim();
      
      const embeddingResponse = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: document
      });

      const embedding = embeddingResponse.data[0]?.embedding;
      if (!embedding) {
        logger.error('Failed to create embedding - no embedding data returned');
        return;
      }

      // Add to ChromaDB with embedding
      await this.collection.add({
        ids: [product.id],
        embeddings: [embedding],
        documents: [document],
        metadatas: [{
          title: product.title,
          description: product.description,
          vendor: product.vendor,
          price: product.price,
          category: product.category || '',
          url: product.url || ''
        }]
      });

      logger.debug(`Added embedding for product: ${product.title}`);
    } catch (error) {
      logger.error(`Failed to add embedding for product ${product.id}:`, error);
    }
  }

  async addProductsBatch(products: ProductEmbedding[]): Promise<void> {
    if (!this.chromaAvailable || !this.collection) {
      logger.warn('ChromaDB not available, skipping batch embedding');
      return;
    }

    try {
      const batchSize = 10; // Process in smaller batches to avoid rate limits
      
      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        
        // Create embeddings for batch
        const documents = batch.map(p => `${p.title} ${p.description} ${p.vendor}`.trim());
        
        const embeddingPromises = documents.map(doc => 
          this.openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: doc
          })
        );

        const embeddingResponses = await Promise.all(embeddingPromises);
        const embeddings = embeddingResponses.map(resp => resp.data[0]?.embedding).filter(Boolean) as number[][];

        // Add batch to ChromaDB
        await this.collection.add({
          ids: batch.map(p => p.id),
          embeddings: embeddings,
          documents: documents,
          metadatas: batch.map(p => ({
            title: p.title,
            description: p.description,
            vendor: p.vendor,
            price: p.price,
            category: p.category || '',
            url: p.url || ''
          }))
        });

        logger.info(`Added batch ${i / batchSize + 1} of ${Math.ceil(products.length / batchSize)} (${batch.length} products)`);
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      logger.info(`Successfully added ${products.length} product embeddings to ChromaDB`);
    } catch (error) {
      logger.error('Failed to add product embeddings batch:', error);
    }
  }

  async searchProducts(
    query: string, 
    limit: number = 10,
    filters?: { vendor?: string; priceRange?: { min: number; max: number } }
  ): Promise<{
    products: SearchResult[];
    total: number;
  }> {
    // Try ChromaDB first, fallback to PostgreSQL
    if (this.isInitialized && this.collection) {
      try {
        return await this.searchWithChromaDB(query, limit, filters);
      } catch (error) {
        logger.error('ChromaDB search failed, falling back to PostgreSQL:', error);
      }
    }

    // Fallback to PostgreSQL search
    return await this.searchWithPostgreSQL(query, limit, filters);
  }

  private async searchWithChromaDB(
    query: string,
    limit: number,
    filters?: { vendor?: string; priceRange?: { min: number; max: number } }
  ): Promise<{ products: SearchResult[]; total: number }> {
    
    // Create embedding for the query
    const queryEmbedding = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query
    });

    // Search with ChromaDB v3.0.0 API
    const queryEmbed = queryEmbedding.data[0]?.embedding;
    if (!queryEmbed) {
      throw new Error('Failed to create query embedding');
    }
    const results = await this.collection.query({
      queryEmbeddings: [queryEmbed],
      nResults: limit
    });

    const products: SearchResult[] = [];
    
    if (results.ids && results.ids[0]) {
      for (let i = 0; i < results.ids[0].length; i++) {
        const metadata = results.metadatas?.[0]?.[i];
        if (metadata) {
          // Apply filters if specified
          if (filters?.vendor && metadata.vendor !== filters.vendor) {
            continue;
          }
          
          const price = Number(metadata.price) || 0;
          if (filters?.priceRange && 
              (price < filters.priceRange.min || price > filters.priceRange.max)) {
            continue;
          }

          products.push({
            id: results.ids[0][i],
            title: metadata.title as string,
            description: metadata.description as string,
            vendor: metadata.vendor as string,
            price: price,
            score: 1 - (results.distances?.[0]?.[i] || 0), // Convert distance to similarity
            url: metadata.url as string
          });
        }
      }
    }

    logger.info(`ChromaDB vector search for "${query}" returned ${products.length} results`);
    
    return {
      products,
      total: products.length
    };
  }

  private async searchWithPostgreSQL(
    query: string,
    limit: number,
    filters?: { vendor?: string; priceRange?: { min: number; max: number } }
  ): Promise<{ products: SearchResult[]; total: number }> {
    const whereConditions: any = {
      OR: [
        { title: { contains: query.trim(), mode: 'insensitive' } },
        { description: { contains: query.trim(), mode: 'insensitive' } },
        { vendor: { contains: query.trim(), mode: 'insensitive' } }
      ]
    };

    const additionalFilters: any[] = [];
    
    if (filters?.vendor) {
      additionalFilters.push({ vendor: { equals: filters.vendor, mode: 'insensitive' } });
    }
    
    if (filters?.priceRange) {
      additionalFilters.push({ 
        price: { 
          gte: filters.priceRange.min,
          lte: filters.priceRange.max
        }
      });
    }

    const finalWhere = additionalFilters.length > 0 
      ? { AND: [whereConditions, ...additionalFilters] }
      : whereConditions;

    const products = await this.prisma.product.findMany({
      where: finalWhere,
      take: limit,
      select: {
        id: true,
        title: true,
        bodyHtml: true,
        vendor: true,
        price: true,
        url: true
      }
    });

    const searchResults: SearchResult[] = products.map((product: any) => ({
      id: product.id,
      title: product.title,
      description: product.bodyHtml || '',
      vendor: product.vendor,
      price: Number(product.price) || 0,
      score: 0.8, // Mock similarity score for PostgreSQL results
      url: product.url || undefined
    }));

    logger.info(`PostgreSQL search for "${query}" returned ${searchResults.length} results`);

    return {
      products: searchResults,
      total: searchResults.length
    };
  }

  async getSimilarProducts(
    productId: string, 
    limit: number = 5
  ): Promise<SearchResult[]> {
    try {
      // Get the product first
      const product = await this.prisma.product.findUnique({
        where: { id: productId }
      });

      if (!product) {
        throw new Error(`Product with ID ${productId} not found`);
      }

      // Use search with the product's title and description
      const searchQuery = `${product.title} ${product.bodyHtml || ''} ${product.vendor}`;
      const results = await this.searchProducts(searchQuery, limit + 1);

      // Filter out the original product and return similar ones
      return results.products
        .filter(p => p.id !== productId)
        .slice(0, limit);
    } catch (error) {
      logger.error('Failed to find similar products:', error);
      throw error;
    }
  }

  async getCollectionStats(): Promise<{
    totalProducts: number;
    collectionName: string;
    vectorSearchEnabled: boolean;
  }> {
    try {
      let chromaCount = 0;
      if (this.chromaAvailable && this.collection) {
        try {
          chromaCount = await this.collection.count();
        } catch (error) {
          logger.warn('Failed to get ChromaDB count:', error);
        }
      }

      const postgresCount = await this.prisma.product.count();
      
      return {
        totalProducts: postgresCount,
        collectionName: this.chromaAvailable ? 'staples_products' : 'postgresql_fallback',
        vectorSearchEnabled: this.chromaAvailable && chromaCount > 0
      };
    } catch (error) {
      logger.error('Failed to get collection stats:', error);
      throw error;
    }
  }

  async clearCollection(): Promise<void> {
    if (!this.chromaAvailable || !this.client) {
      logger.info('ChromaDB not available for clearing');
      return;
    }

    try {
      await this.client.deleteCollection({ name: 'staples_products' });
      logger.info('ChromaDB collection cleared successfully');
      
      // Reinitialize
      await this.initialize();
    } catch (error) {
      logger.error('Failed to clear ChromaDB collection:', error);
      throw error;
    }
  }
}

export const chromaService = new ChromaService();
