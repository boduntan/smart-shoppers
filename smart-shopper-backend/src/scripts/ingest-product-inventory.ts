/**
 * Ingest Structured Product Inventory CSV
 * ======================================
 * 
 * This script processes the master_inventory_with_ratings_wspecs.csv file
 * and creates properly structured Product entries in the database.
 * Supports multiple categories: Laptop, Monitor, Printer, Chair, Desk, etc.
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parse/sync';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// Helper function to normalize category names
function normalizeCategory(category: string): string {
  const normalized = category.trim();
  
  // Handle special cases to avoid search conflicts
  switch (normalized.toLowerCase()) {
    case 'laptop bag':
      return 'Bag';
    default:
      return normalized;
  }
}

interface ProductCSVRow {
  ItemID: string;
  Category: string;
  Vendor: string;
  Name: string;
  Description: string;
  'CPU/SoC': string;
  RAM_GB: string;
  Storage_GB: string;
  GPU: string;
  Screen_Size_Inch: string;
  OS: string;
  Price: string;
  Rating: string;
}

interface ProductData {
  id: string;
  title: string;
  bodyHtml: string;
  vendor: string;
  url: string;
  category: string;
  price: number;
  rating: number;
  specifications: Record<string, any>;
  images: string[];
  tags: string[];
}

// Helper function to build specifications based on product category
function buildSpecifications(record: ProductCSVRow): Record<string, any> {
  const specs: Record<string, any> = {};
  
  // Common fields for all products
  if (record['CPU/SoC']) specs.cpu = record['CPU/SoC'];
  if (record.RAM_GB) specs.ram = parseFloat(record.RAM_GB) || 0;
  if (record.Storage_GB) specs.storage = parseFloat(record.Storage_GB) || 0;
  if (record.GPU) specs.gpu = record.GPU;
  if (record.Screen_Size_Inch) specs.screenSize = parseFloat(record.Screen_Size_Inch) || 0;
  if (record.OS) specs.os = record.OS;
  
  // Category-specific specifications
  switch (record.Category.toLowerCase()) {
    case 'laptop':
      specs.type = 'laptop';
      break;
    case 'monitor':
      specs.type = 'monitor';
      specs.displaySize = parseFloat(record.Screen_Size_Inch) || 0;
      break;
    case 'printer':
      specs.type = 'printer';
      break;
    case 'chair':
      specs.type = 'chair';
      specs.furniture = true;
      break;
    case 'desk':
      specs.type = 'desk';
      specs.furniture = true;
      break;
    default:
      specs.type = record.Category.toLowerCase();
  }
  
  return specs;
}

// Helper function to generate category-specific tags
function getSpecificTags(record: ProductCSVRow): string[] {
  const tags: string[] = [];
  
  // Add CPU/GPU tags if available
  if (record['CPU/SoC']) {
    tags.push(...record['CPU/SoC'].toLowerCase().split(' ').slice(0, 3));
  }
  if (record.GPU) {
    tags.push(...record.GPU.toLowerCase().split(' ').slice(0, 2));
  }
  if (record.OS) {
    tags.push(record.OS.toLowerCase());
  }
  
  // Add size/capacity tags
  const ramGB = parseFloat(record.RAM_GB);
  const storageGB = parseFloat(record.Storage_GB);
  const screenSize = parseFloat(record.Screen_Size_Inch);
  
  if (ramGB > 0) tags.push(`${ramGB}gb-ram`);
  if (storageGB > 0) tags.push(`${storageGB}gb-storage`);
  if (screenSize > 0) tags.push(`${screenSize}-inch`);
  
  return tags.filter(tag => tag && tag.length > 1);
}

async function ingestProductInventory() {
  try {
    logger.info('🚀 Starting product inventory ingestion...');

    // Read and parse CSV
    const csvPath = path.join(process.cwd(), 'master_inventory_with_ratings_wspecs.csv');
    
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found at: ${csvPath}`);
    }

    const csvData = fs.readFileSync(csvPath, 'utf-8');
    const records: ProductCSVRow[] = csv.parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      delimiter: ','
    });

    logger.info(`📊 Found ${records.length} products to process`);

    const products: ProductData[] = [];
    let processed = 0;

    for (const record of records) {
      try {
        // Generate a clean product URL
        const cleanName = record.Name.toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 50);
        
        const productUrl = `https://staples.ca/products/${record.ItemID.toLowerCase()}-${cleanName}`;

        // Parse specifications based on category
        const normalizedCategory = normalizeCategory(record.Category);
        const specifications = buildSpecifications({ ...record, Category: normalizedCategory });

        // Generate tags for better search
        const tags = [
          normalizedCategory.toLowerCase(),
          record.Vendor.toLowerCase(),
          ...getSpecificTags(record)
        ].filter(tag => tag && tag.length > 1);

        // Determine default image based on category
        const defaultImage = `/uploads/images/categories/${normalizedCategory.toLowerCase()}-default.jpg`;

        const price = parseFloat(record.Price) || 0;
        const rating = parseFloat(record.Rating) || 0;

        const product: ProductData = {
          id: record.ItemID,
          title: record.Name,
          bodyHtml: record.Description,
          vendor: record.Vendor,
          url: productUrl,
          category: normalizedCategory,
          price,
          rating,
          specifications,
          images: [defaultImage],
          tags
        };

        products.push(product);
        processed++;

        if (processed % 10 === 0) {
          logger.info(`✅ Processed ${processed}/${records.length} products`);
        }

      } catch (error) {
        logger.error(`❌ Error processing product ${record.ItemID}:`, error);
      }
    }

    // Batch insert products
    logger.info('💾 Inserting products into database...');
    
    let inserted = 0;
    const batchSize = 10;

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      
      try {
        for (const product of batch) {
          await prisma.product.create({
            data: {
              id: product.id,
              title: product.title,
              bodyHtml: product.bodyHtml,
              vendor: product.vendor,
              url: product.url,
              category: product.category,
              price: product.price,
              rating: product.rating,
              specifications: product.specifications,
              images: product.images,
              tags: product.tags,
              inStock: true,
              embeddings: [] // We'll generate these later if needed
            }
          });
          inserted++;
        }

        if (inserted % 50 === 0) {
          logger.info(`💾 Inserted ${inserted}/${products.length} products`);
        }

      } catch (error) {
        logger.error(`❌ Batch insert error:`, error);
        // Continue with next batch
      }
    }

    // Generate summary statistics
    const stats = await generateStats();
    
    logger.info('🎉 Product inventory ingestion completed!');
    logger.info(`📊 Final Statistics:`);
    logger.info(`   • Total products: ${stats.totalProducts}`);
    logger.info(`   • Categories: ${stats.categories.join(', ')}`);
    logger.info(`   • Vendors: ${stats.vendors.length} (${stats.vendors.slice(0, 5).join(', ')}...)`);
    logger.info(`   • Price range: $${stats.priceRange.min} - $${stats.priceRange.max}`);
    logger.info(`   • Average rating: ${stats.avgRating.toFixed(1)}`);

    return stats;

  } catch (error) {
    logger.error('💥 Fatal error during ingestion:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function generateStats() {
  const totalProducts = await prisma.product.count();
  
  const categories = await prisma.product.findMany({
    select: { category: true },
    distinct: ['category']
  });

  const vendors = await prisma.product.findMany({
    select: { vendor: true },
    distinct: ['vendor']
  });

  const priceStats = await prisma.product.aggregate({
    _min: { price: true },
    _max: { price: true },
    _avg: { rating: true }
  });

  return {
    totalProducts,
    categories: categories.map(c => c.category).filter(Boolean),
    vendors: vendors.map(v => v.vendor).sort(),
    priceRange: {
      min: Number(priceStats._min.price) || 0,
      max: Number(priceStats._max.price) || 0
    },
    avgRating: Number(priceStats._avg.rating) || 0
  };
}

// Run if called directly
if (require.main === module) {
  ingestProductInventory()
    .then(() => {
      logger.info('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('💥 Script failed:', error);
      process.exit(1);
    });
}

export { ingestProductInventory };
