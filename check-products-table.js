const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});

async function checkProductsTable() {
  try {
    const client = await pool.connect();

    console.log('🔍 Checking products table structure...');

    // Show table structure
    const tableStructure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'products'
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Products table structure:');
    tableStructure.rows.forEach((col, index) => {
      console.log(`${index + 1}. ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'YES' ? 'Nullable' : 'Not Null'}`);
    });

    // Show some sample products
    const sampleProducts = await client.query(`
      SELECT * FROM products LIMIT 3
    `);

    console.log('\n📋 Sample products:');
    sampleProducts.rows.forEach((product, index) => {
      console.log(`${index + 1}. Product:`, product);
    });

    client.release();

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkProductsTable();
