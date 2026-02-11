/**
 * Migration: Fix Category Names
 * =============================
 * 
 * This migration fixes category naming conflicts by renaming
 * "Laptop Bag" to "Bag" to avoid search confusion with "Laptop".
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

async function migrateCategoryNames() {
  try {
    logger.info('🔄 Starting category name migration...');

    // Update "Laptop Bag" to "Bag"
    const result = await prisma.product.updateMany({
      where: {
        category: 'Laptop Bag'
      },
      data: {
        category: 'Bag'
      }
    });

    logger.info(`✅ Updated ${result.count} products from "Laptop Bag" to "Bag"`);

    // Update image paths for consistency
    const imageUpdateResult = await prisma.product.updateMany({
      where: {
        images: {
          has: '/uploads/images/categories/laptop bag-default.jpg'
        }
      },
      data: {
        images: ['/uploads/images/categories/bag-default.jpg']
      }
    });

    logger.info(`✅ Updated ${imageUpdateResult.count} product image paths`);

    // Update tags that contain "laptop bag"
    const productsWithBadTags = await prisma.product.findMany({
      where: {
        tags: {
          hasSome: ['laptop bag', 'laptop-bag']
        }
      }
    });

    for (const product of productsWithBadTags) {
      const updatedTags = product.tags.map(tag => 
        tag === 'laptop bag' || tag === 'laptop-bag' ? 'bag' : tag
      );

      await prisma.product.update({
        where: { id: product.id },
        data: { tags: updatedTags }
      });
    }

    logger.info(`✅ Updated tags for ${productsWithBadTags.length} products`);

    // Show final category counts
    const categoryStats = await prisma.product.groupBy({
      by: ['category'],
      _count: {
        id: true
      },
      orderBy: {
        category: 'asc'
      }
    });

    logger.info('📊 Final category distribution:');
    categoryStats.forEach(stat => {
      logger.info(`   • ${stat.category}: ${stat._count.id} products`);
    });

    logger.info('🎉 Category migration completed successfully!');

  } catch (error) {
    logger.error('💥 Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  migrateCategoryNames()
    .then(() => {
      logger.info('✅ Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

export { migrateCategoryNames };
