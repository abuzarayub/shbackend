const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});

async function checkItemsTable() {
  try {
    const client = await pool.connect();

    console.log("🔍 Checking for items table...");

    // Check if items table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'items'
      );
    `);

    if (tableExists.rows[0].exists) {
      console.log("✅ Items table exists");

      // Show table structure
      const tableStructure = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'items'
        ORDER BY ordinal_position;
      `);

      console.log("\n📋 Items table structure:");
      tableStructure.rows.forEach((col, index) => {
        console.log(
          `${index + 1}. ${col.column_name} (${col.data_type}) - ${col.is_nullable === "YES" ? "Nullable" : "Not Null"}`
        );
      });
    } else {
      console.log("❌ Items table does not exist");
    }

    // Also check if there's a products table
    const productsExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'products'
      );
    `);

    if (productsExists.rows[0].exists) {
      console.log("\n✅ Products table exists");

      // Show products table structure
      const productsStructure = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'products'
        ORDER BY ordinal_position;
      `);

      console.log("\n📋 Products table structure:");
      productsStructure.rows.forEach((col, index) => {
        console.log(
          `${index + 1}. ${col.column_name} (${col.data_type}) - ${col.is_nullable === "YES" ? "Nullable" : "Not Null"}`
        );
      });
    }

    client.release();
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await pool.end();
  }
}

checkItemsTable();
