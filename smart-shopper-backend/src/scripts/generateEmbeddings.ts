import { PrismaClient } from '@prisma/client';
import { chromaService } from '../services/chromaService';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

async function generateProductEmbeddings() {
  try {
    logger.info('Starting product embeddings generation...');

    // Initialize ChromaDB
    await chromaService.initialize();
    
    // Get total count of products
    const totalProducts = await prisma.product.count();
    logger.info(`Found ${totalProducts} products to process`);

    const batchSize = 50; // Process in smaller batches to avoid rate limits
    let processed = 0;

    // Process products in batches
    for (let skip = 0; skip < totalProducts; skip += batchSize) {
      const products = await prisma.product.findMany({
        skip,
        take: batchSize,
        select: {
          id: true,
          title: true,
          description: true,
          vendor: true,
          price: true,
          category: true,
          url: true
        }
      });

      // Convert to embedding format
      const embeddingProducts = products.map(product => ({
        id: product.id,
        title: product.title,
        description: product.description || '',
        vendor: product.vendor,
        price: Number(product.price) || 0,
        category: product.category,
        url: product.url
      }));

      // Add to ChromaDB
      await chromaService.addProductsBatch(embeddingProducts);
      
      processed += products.length;
      logger.info(`Processed ${processed}/${totalProducts} products (${Math.round((processed/totalProducts)*100)}%)`);

      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Get final stats
    const stats = await chromaService.getCollectionStats();
    logger.info('✅ Embeddings generation complete!');
    logger.info(`📊 Total products in vector database: ${stats.totalProducts}`);

  } catch (error) {
    logger.error('❌ Failed to generate embeddings:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Check if this script is being run directly
if (require.main === module) {
  generateProductEmbeddings()
    .then(() => {
      logger.info('🎉 Embeddings generation completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('💥 Embeddings generation failed:', error);
      process.exit(1);
    });
}

export { generateProductEmbeddings };
