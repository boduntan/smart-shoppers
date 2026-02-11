const fs = require('fs');
const csv = require('csv-parser');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function ingestProducts() {
  console.log('🔄 Starting product ingestion...');
  
  let processed = 0;
  let errors = 0;
  const products = [];
  
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
            console.log('Skipping row - missing data:', { title: !!title, vendor: !!vendor, keys: Object.keys(row) });
            return;
          }
          
          // Generate unique ID
          const id = `${vendor.toLowerCase().replace(/\s+/g, '-')}-${title.toLowerCase().replace(/\s+/g, '-').substring(0, 50)}`;
          
          products.push({
            id,
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
            console.log(`📦 Processed ${processed} products...`);
          }
          
        } catch (error) {
          errors++;
          console.error('Error processing row:', error);
        }
      })
      .on('end', async () => {
        try {
          console.log(`💾 Inserting ${products.length} products into database...`);
          
          // Insert in batches of 100
          const batchSize = 100;
          let inserted = 0;
          
          for (let i = 0; i < products.length; i += batchSize) {
            const batch = products.slice(i, i + batchSize);
            
            const operations = batch.map(product => 
              prisma.product.upsert({
                where: { id: product.id },
                update: {
                  title: product.title,
                  bodyHtml: product.bodyHtml,
                  vendor: product.vendor,
                  url: product.url,
                  category: product.category,
                  price: product.price,
                  inStock: product.inStock,
                  images: product.images,
                  specifications: product.specifications,
                  updatedAt: new Date()
                },
                create: {
                  id: product.id,
                  title: product.title,
                  bodyHtml: product.bodyHtml,
                  vendor: product.vendor,
                  url: product.url || `https://staples.ca/product/${product.id}`,
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
              console.log(`💿 Inserted ${inserted} products into database...`);
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
          
          console.log('✅ Ingestion completed!');
          console.log(`📊 Total products: ${totalProducts}`);
          console.log(`🏢 Top vendors: ${vendors.map(v => `${v.vendor} (${v._count.vendor})`).join(', ')}`);
          console.log(`❌ Errors: ${errors}`);
          
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

async function main() {
  try {
    await ingestProducts();
  } catch (error) {
    console.error('Ingestion failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
