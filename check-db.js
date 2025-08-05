const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function checkDatabase() {
  try {
    console.log('🔍 Checking database connection...');

    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connected successfully!');

    // List all tables
    const tablesQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;

    const tablesResult = await client.query(tablesQuery);
    console.log('\n📋 Existing tables:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // Check if enrollments table exists and its structure
    const enrollmentsQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'enrollments'
      ORDER BY ordinal_position;
    `;

    const enrollmentsResult = await client.query(enrollmentsQuery);
    if (enrollmentsResult.rows.length > 0) {
      console.log('\n📊 Enrollments table structure:');
      enrollmentsResult.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    } else {
      console.log('\n❌ Enrollments table does not exist!');
    }

    // Check if progress table exists and its structure
    const progressQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'progress'
      ORDER BY ordinal_position;
    `;

    const progressResult = await client.query(progressQuery);
    if (progressResult.rows.length > 0) {
      console.log('\n📈 Progress table structure:');
      progressResult.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    } else {
      console.log('\n❌ Progress table does not exist!');
    }

    // Check if platform_users table exists
    const platformUsersQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'platform_users'
      ORDER BY ordinal_position;
    `;

    const platformUsersResult = await client.query(platformUsersQuery);
    if (platformUsersResult.rows.length > 0) {
      console.log('\n👥 Platform_users table structure:');
      platformUsersResult.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    } else {
      console.log('\n❌ Platform_users table does not exist!');
    }

    client.release();

  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  } finally {
    await pool.end();
  }
}

checkDatabase();
