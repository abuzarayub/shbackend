const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});

async function createTransactionsTable() {
  try {
    const client = await pool.connect();

    console.log("🔍 Checking for transactions table...");

    // Check if transactions table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'transactions'
      );
    `);

    if (tableExists.rows[0].exists) {
      console.log("✅ Transactions table already exists");

      // Show table structure
      const tableStructure = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'transactions'
        ORDER BY ordinal_position;
      `);

      console.log("\n📋 Current table structure:");
      tableStructure.rows.forEach((col, index) => {
        console.log(
          `${index + 1}. ${col.column_name} (${col.data_type}) - ${col.is_nullable === "YES" ? "Nullable" : "Not Null"}`
        );
      });
    } else {
      console.log("❌ Transactions table does not exist. Creating it...");

      // Create transactions table
      const createTableQuery = `
        CREATE TABLE transactions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES platform_users(id),
          amount DECIMAL(10,2) NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'pending',
          payment_method VARCHAR(100),
          next_billing_date TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `;

      await client.query(createTableQuery);
      console.log("✅ Transactions table created successfully");

      // Create some sample transactions
      const sampleTransactions = [
        {
          user_id: "3e9f356b-ae95-474b-9552-9e17c855c516", // admin user
          amount: 99.99,
          status: "success",
          payment_method: "credit_card",
          next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        },
        {
          user_id: "3e9f356b-ae95-474b-9552-9e17c855c516",
          amount: 49.99,
          status: "success",
          payment_method: "paypal",
          next_billing_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        },
        {
          user_id: "3e9f356b-ae95-474b-9552-9e17c855c516",
          amount: 199.99,
          status: "pending",
          payment_method: "bank_transfer",
          next_billing_date: null,
        },
      ];

      for (const transaction of sampleTransactions) {
        await client.query(
          `
          INSERT INTO transactions (user_id, amount, status, payment_method, next_billing_date)
          VALUES ($1, $2, $3, $4, $5)
        `,
          [
            transaction.user_id,
            transaction.amount,
            transaction.status,
            transaction.payment_method,
            transaction.next_billing_date,
          ]
        );
      }

      console.log("✅ Sample transactions created");
    }

    // Show all tables for reference
    const allTables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log("\n📋 All tables in database:");
    allTables.rows.forEach((table, index) => {
      console.log(`${index + 1}. ${table.table_name}`);
    });

    client.release();
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await pool.end();
  }
}

createTransactionsTable();
