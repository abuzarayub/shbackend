const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});

async function quickTest() {
  try {
    const client = await pool.connect();

    // Check users
    const users = await client.query('SELECT id, email, full_name, role FROM platform_users LIMIT 5');
    console.log('👥 Users:', users.rows);

    // Check enrollments
    const enrollments = await client.query('SELECT * FROM enrollments LIMIT 5');
    console.log('📚 Enrollments:', enrollments.rows);

    // Check products
    const products = await client.query('SELECT * FROM products LIMIT 5');
    console.log('🛍️ Products:', products.rows);

    // Create a test enrollment if none exist
    if (enrollments.rows.length === 0 && users.rows.length > 0 && products.rows.length > 0) {
      const userId = users.rows[0].id;
      const productId = products.rows[0].id;

      await client.query(`
        INSERT INTO enrollments (user_id, product_id, status, enrolled_at)
        VALUES ($1, $2, $3, $4)
      `, [userId, productId, 'ENROLLED', new Date().toISOString()]);

      console.log('✅ Created test enrollment');
    }

    client.release();
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

quickTest();
