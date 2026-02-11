import { ChromaClient } from 'chromadb';
import { logger } from '../utils/logger';

interface ProductDocument {
  id: string;
  name: string;
  description: string;
  brand?: string;
  category?: string;
  price?: number;
  metadata?: Record<string, any>;
}

interface SearchResult {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  price?: number;
  relevanceScore: number;
  snippet: string;
}

export class VectorSearchService {
  private client: ChromaClient;
  private collection: any = null;
  private collectionName = 'staples-products';

  constructor() {
    this.client = new ChromaClient({
      path: process.env.CHROMA_URL || 'http://emraay-chroma:8000'
    });
  }

  async initialize(): Promise<boolean> {
    try {
      // Get or create collection
      this.collection = await this.client.getOrCreateCollection({
        name: this.collectionName,
        metadata: { description: 'Staples product embeddings' }
      });
      
      logger.info('ChromaDB vector search service initialized');
      return true;
    } catch (error) {
      logger.warn('ChromaDB not available, vector search disabled:', error);
      return false;
    }
  }

  async addProducts(products: ProductDocument[]): Promise<void> {
    if (!this.collection) {
      throw new Error('Vector service not initialized');
    }

    try {
      const ids = products.map(p => p.id);
      const documents = products.map(p => 
        `${p.name} ${p.description || ''} ${p.brand || ''} ${p.category || ''}`
      );
      const metadatas = products.map(p => ({
        name: p.name,
        brand: p.brand || '',
        category: p.category || '',
        price: p.price || 0,
        ...p.metadata
      }));

      await this.collection.add({
        ids,
        documents,
        metadatas
      });

      logger.info(`Added ${products.length} products to ChromaDB`);
    } catch (error) {
      logger.error('Error adding products to ChromaDB:', error);
      throw error;
    }
  }

  async searchProducts(query: string, limit: number = 10): Promise<SearchResult[]> {
    if (!this.collection) {
      logger.warn('Vector service not initialized, returning empty results');
      return [];
    }

    try {
      const results = await this.collection.query({
        queryTexts: [query],
        nResults: limit
      });

      if (!results.ids || !results.ids[0]) {
        return [];
      }

      return results.ids[0].map((id: string, index: number) => ({
        id,
        name: results.metadatas?.[0]?.[index]?.name || '',
        brand: results.metadatas?.[0]?.[index]?.brand || '',
        category: results.metadatas?.[0]?.[index]?.category || '',
        price: results.metadatas?.[0]?.[index]?.price || 0,
        relevanceScore: 1 - (results.distances?.[0]?.[index] || 1),
        snippet: results.documents?.[0]?.[index]?.substring(0, 200) + '...' || ''
      }));
    } catch (error) {
      logger.error('Error in ChromaDB search:', error);
      return [];
    }
  }

  async semanticSearch(
    query: string, 
    filters?: Record<string, any>, 
    limit: number = 10
  ): Promise<SearchResult[]> {
    // ChromaDB filtering (basic implementation)
    const whereClause = filters ? { $and: Object.entries(filters).map(([key, value]) => ({ [key]: { $eq: value } })) } : undefined;
    
    if (!this.collection) {
      return [];
    }

    try {
      const results = await this.collection.query({
        queryTexts: [query],
        nResults: limit,
        where: whereClause
      });

      if (!results.ids || !results.ids[0]) {
        return [];
      }

      return results.ids[0].map((id: string, index: number) => ({
        id,
        name: results.metadatas?.[0]?.[index]?.name || '',
        brand: results.metadatas?.[0]?.[index]?.brand || '',
        category: results.metadatas?.[0]?.[index]?.category || '',
        price: results.metadatas?.[0]?.[index]?.price || 0,
        relevanceScore: 1 - (results.distances?.[0]?.[index] || 1),
        snippet: results.documents?.[0]?.[index]?.substring(0, 200) + '...' || ''
      }));
    } catch (error) {
      logger.error('Error in ChromaDB semantic search:', error);
      return [];
    }
  }

  async getCollectionStats(): Promise<{ count: number; name: string }> {
    if (!this.collection) {
      return { count: 0, name: this.collectionName };
    }

    try {
      const count = await this.collection.count();
      return { count, name: this.collectionName };
    } catch (error) {
      logger.error('Error getting collection stats:', error);
      return { count: 0, name: this.collectionName };
    }
  }
}

export const vectorService = new VectorSearchService();
