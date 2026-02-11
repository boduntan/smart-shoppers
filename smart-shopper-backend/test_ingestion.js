#!/usr/bin/env node

const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

// Simple CSV ingestion script
async function ingestCSV() {
  console.log('🚀 Starting CSV ingestion...');
  
  const csvPath = path.join(process.cwd(), 'Staples Canada Products-20k.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error('❌ CSV file not found:', csvPath);
    process.exit(1);
  }

  let count = 0;
  const products = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        const product = {
          id: `staples-${count++}`,
          title: row.Title?.trim() || 'Unknown Product',
          bodyHtml: row['Body HTML']?.trim() || null,
          vendor: row.Vendor?.trim() || 'Unknown Vendor',
          url: row.URL?.trim() || null
        };
        
        products.push(product);
        
        if (count % 1000 === 0) {
          console.log(`📊 Processed ${count} products...`);
        }
        
        // Stop at first 100 for testing
        if (count >= 100) {
          console.log(`✅ Processed first ${count} products for testing`);
          resolve(products);
        }
      })
      .on('end', () => {
        console.log(`✅ CSV parsing complete! Total: ${count} products`);
        resolve(products);
      })
      .on('error', (error) => {
        console.error('❌ CSV parsing error:', error);
        reject(error);
      });
  });
}

// Run the ingestion
ingestCSV()
  .then(products => {
    console.log('\n📋 Sample products:');
    console.log(JSON.stringify(products.slice(0, 3), null, 2));
    console.log(`\n✅ Ingestion test complete! Found ${products.length} products`);
    
    // Write to temp file for inspection
    fs.writeFileSync('/tmp/sample_products.json', JSON.stringify(products.slice(0, 10), null, 2));
    console.log('📝 Sample data written to /tmp/sample_products.json');
  })
  .catch(error => {
    console.error('❌ Ingestion failed:', error);
    process.exit(1);
  });
