import path from 'path';
import { PrismaClient } from '@prisma/client';
import { ProductIngestionService } from '../services/productIngestionService';
import { vectorService } from '../services/vectorService';
import { logger } from '../utils/logger';

async function main() {
  const prisma = new PrismaClient();
  const ingestionService = new ProductIngestionService(prisma);

  try {
    // Initialize vector service
    logger.info('Initializing vector search service...');
    await vectorService.initialize();

    // Look for CSV files in the project root
    const csvFiles = [
      'Staples Canada Products-20k.csv',
      'AI Shopping Assistant.csv',
      'products.csv'
    ];

    let csvPath: string | null = null;
    
    for (const fileName of csvFiles) {
      const fullPath = path.join(process.cwd(), fileName);
      try {
        const fs = await import('fs');
        if (fs.existsSync(fullPath)) {
          csvPath = fullPath;
          logger.info(`Found CSV file: ${fileName}`);
          break;
        }
      } catch {
        // Continue searching
      }
    }

    if (!csvPath) {
      logger.error('No CSV file found. Expected files:');
      csvFiles.forEach(file => logger.error(`  - ${file}`));
      process.exit(1);
    }

    // Start ingestion
    logger.info(`Starting product ingestion from: ${csvPath}`);
    const startTime = Date.now();
    
    const result = await ingestionService.ingestCSV(csvPath);
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    logger.info('='.repeat(50));
    logger.info('🎉 INGESTION COMPLETE!');
    logger.info('='.repeat(50));
    logger.info(`✅ Products processed: ${result.success}`);
    logger.info(`❌ Errors: ${result.errors}`);
    logger.info(`⏱️  Duration: ${duration.toFixed(2)} seconds`);
    logger.info(`📊 Rate: ${(result.success / duration).toFixed(2)} products/sec`);

    // Get stats
    logger.info('\n📈 Getting database stats...');
    const stats = await ingestionService.getIngestionStats();
    
    logger.info(`🗄️  Total products in database: ${stats.totalProducts}`);
    logger.info(`🏷️  Categories found: ${stats.categories.length}`);
    logger.info(`🏢 Brands found: ${stats.brands.length}`);
    
    if (stats.priceRange.min && stats.priceRange.max) {
      logger.info(`💰 Price range: $${stats.priceRange.min.toFixed(2)} - $${stats.priceRange.max.toFixed(2)}`);
    }

    logger.info('\n🔝 Top categories:');
    stats.categories.slice(0, 5).forEach((category: string) => {
      logger.info(`   • ${category}`);
    });

    logger.info('\n🔝 Top vendors:');
    stats.vendors.slice(0, 5).forEach((vendor: string) => {
      logger.info(`   • ${vendor}`);
    });

    // Test vector search if available
    try {
      const vectorStats = await vectorService.getCollectionStats();
      logger.info(`\n🔍 Vector search: ${vectorStats.count} products indexed`);
    } catch (error) {
      logger.warn('Vector search not available:', error);
    }

  } catch (error) {
    logger.error('Ingestion failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}
