const { Pool } = require('pg');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const pool = new Pool({
  user: 'smartshopper',
  password: 'smartshopper123',
  host: 'localhost',
  port: 5432,
  database: 'smartshopper'
});

async function ingestProducts() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting product ingestion...');
    
    // Clear existing products
    await client.query('DELETE FROM products WHERE 1=1');
    console.log('🧹 Cleared existing products');
    
    const csvPath = '/app/data/Staples Canada Products-20k.csv';
    console.log(`📂 Reading CSV from: ${csvPath}`);
    
    const products = [];
    
    return new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
          // Clean and validate data
          const name = row.name?.trim() || 'Unknown Product';
          const category = row.category?.trim() || 'Uncategorized';
          const brand = row.brand?.trim() || 'Unknown Brand';
          const sku = row.sku?.trim() || null;
          const model = row.model?.trim() || null;
          const description = row.description?.trim() || null;
          
          // Parse price - remove currency symbols and convert to number
          let price = null;
          if (row.price) {
            const priceStr = row.price.toString().replace(/[$,CAD\s]/g, '');
            const parsedPrice = parseFloat(priceStr);
            if (!isNaN(parsedPrice) && parsedPrice > 0) {
              price = parsedPrice;
            }
          }
          
          // Only add products with valid names and prices
          if (name !== 'Unknown Product' && price !== null) {
            products.push({
              name,
              category,
              brand,
              sku,
              model,
              description,
              price
            });
          }
        })
        .on('end', async () => {
          try {
            console.log(`📊 Parsed ${products.length} valid products`);
            
            let insertCount = 0;
            const batchSize = 100;
            
            for (let i = 0; i < products.length; i += batchSize) {
              const batch = products.slice(i, i + batchSize);
              
              // Create parameterized query for batch insert
              const values = [];
              const valueStrings = [];
              
              batch.forEach((product, index) => {
                const baseIndex = index * 7;
                valueStrings.push(`($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7})`);
                values.push(
                  product.name,
                  product.category,
                  product.brand,
                  product.sku,
                  product.model,
                  product.description,
                  product.price
                );
              });
              
              const insertQuery = `
                INSERT INTO products (name, category, brand, sku, model, description, price)
                VALUES ${valueStrings.join(', ')}
                ON CONFLICT (sku) DO NOTHING
              `;
              
              await client.query(insertQuery, values);
              insertCount += batch.length;
              
              if (insertCount % 1000 === 0) {
                console.log(`✅ Inserted ${insertCount} products...`);
              }
            }
            
            // Get final count
            const result = await client.query('SELECT COUNT(*) as count FROM products');
            const totalProducts = parseInt(result.rows[0].count);
            
            console.log(`🎉 Product ingestion complete!`);
            console.log(`📊 Total products in database: ${totalProducts}`);
            
            // Sample some products
            const sampleResult = await client.query('SELECT name, category, brand, price FROM products LIMIT 5');
            console.log('\n📋 Sample products:');
            sampleResult.rows.forEach((row, index) => {
              console.log(`${index + 1}. ${row.name} - ${row.brand} - $${row.price} (${row.category})`);
            });
            
            resolve();
          } catch (error) {
            reject(error);
          }
        })
        .on('error', reject);
    });
  } catch (error) {
    console.error('❌ Ingestion failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the ingestion
ingestProducts().then(() => {
  console.log('✅ Script completed successfully');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
