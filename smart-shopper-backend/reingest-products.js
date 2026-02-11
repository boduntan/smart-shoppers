const fs = require('fs');
const csv = require('csv-parser');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function reingestProducts() {
  console.log('🔄 Re-ingesting products with unique IDs...');
  
  // First, clear existing products
  console.log('🗑️  Clearing existing products...');
  await prisma.product.deleteMany({});
  
  let processed = 0;
  let errors = 0;
  const products = [];
  const usedIds = new Set(); // Track used IDs to prevent duplicates
  
  return new Promise((resolve, reject) => {
    fs.createReadStream('/app/Staples Canada Products-20k.csv')
      .pipe(csv())
      .on('data', (row) => {
        try {
          // Handle BOM character in column names
          const title = row['Title'] || row['\ufeffTitle'] || row['﻿Title'];
          const bodyHtml = row['Body HTML'];
          const vendor = row['Vendor'];
          const url = row['URL'];
          
          if (!title || !vendor) {
            errors++;
            console.log('Skipping row - missing data:', { title: !!title, vendor: !!vendor });
            return;
          }
          
          // Generate unique ID using multiple strategies
          let id = generateUniqueId(vendor, title, url);
          
          // If ID already used, add hash suffix
          if (usedIds.has(id)) {
            const hash = crypto.createHash('md5').update(title + vendor + (url || '')).digest('hex').substring(0, 8);
            id = id + '-' + hash;
          }
          
          // Final check with counter if still duplicate
          let finalId = id;
          let counter = 1;
          while (usedIds.has(finalId)) {
            finalId = id + '-' + counter;
            counter++;
          }
          
          usedIds.add(finalId);
          
          products.push({
            id: finalId,
            title: title.trim(),
            bodyHtml: bodyHtml?.trim() || null,
            vendor: vendor.trim(),
            url: url?.trim() || null,
            category: null,
            price: null,
            inStock: true,
            images: [],
            specifications: {}
          });
          
          processed++;
          
          if (processed % 1000 === 0) {
            console.log('📦 Processed ' + processed + ' products...');
          }
          
        } catch (error) {
          errors++;
          console.error('Error processing row:', error);
        }
      })
      .on('end', async () => {
        try {
          console.log('💾 Inserting ' + products.length + ' products into database...');
          console.log('🔑 Generated ' + usedIds.size + ' unique IDs');
          
          // Insert in batches of 100
          const batchSize = 100;
          let inserted = 0;
          
          for (let i = 0; i < products.length; i += batchSize) {
            const batch = products.slice(i, i + batchSize);
            
            const operations = batch.map(product => 
              prisma.product.create({
                data: {
                  id: product.id,
                  title: product.title,
                  bodyHtml: product.bodyHtml,
                  vendor: product.vendor,
                  url: product.url || 'https://staples.ca/product/' + product.id,
                  category: product.category,
                  price: product.price,
                  inStock: product.inStock,
                  images: product.images,
                  specifications: product.specifications
                }
              })
            );
            
            await prisma.$transaction(operations);
            inserted += batch.length;
            
            if (inserted % 1000 === 0) {
              console.log('💿 Inserted ' + inserted + ' products into database...');
            }
          }
          
          // Get final stats
          const totalProducts = await prisma.product.count();
          const vendors = await prisma.product.groupBy({
            by: ['vendor'],
            _count: true,
            orderBy: { _count: { vendor: 'desc' } },
            take: 10
          });
          
          console.log('✅ Re-ingestion completed!');
          console.log('📊 Total products: ' + totalProducts);
          console.log('🏢 Top vendors: ' + vendors.map(v => v.vendor + ' (' + v._count.vendor + ')').join(', '));
          console.log('❌ Errors: ' + errors);
          console.log('📈 Improvement: +' + (totalProducts - 7707) + ' products');
          
          resolve({ success: totalProducts, errors });
          
        } catch (error) {
          console.error('Database insertion error:', error);
          reject(error);
        }
      })
      .on('error', (error) => {
        console.error('CSV parsing error:', error);
        reject(error);
      });
  });
}

function generateUniqueId(vendor, title, url) {
  // Strategy 1: Use URL if available (most unique)
  if (url && url.includes('products/')) {
    const urlParts = url.split('/');
    const productPart = urlParts[urlParts.length - 1];
    if (productPart && productPart.length > 5) {
      return productPart.substring(0, 50);
    }
  }
  
  // Strategy 2: Vendor + first 30 chars of title + hash of full title
  const vendorSlug = vendor.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const titleSlug = title.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 30);
  const titleHash = crypto.createHash('md5').update(title).digest('hex').substring(0, 8);
  
  return vendorSlug + '-' + titleSlug + '-' + titleHash;
}

async function main() {
  try {
    await reingestProducts();
  } catch (error) {
    console.error('Re-ingestion failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
