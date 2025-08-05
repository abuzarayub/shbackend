const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});

async function fixTransactionsTable() {
  try {
    const client = await pool.connect();

    console.log("🔧 Fixing transactions table structure...");

    // Add missing columns that the backend controller expects
    const alterQueries = [
      "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100);",
      "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMP;",
      "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();",
    ];

    for (const query of alterQueries) {
      try {
        await client.query(query);
        console.log("✅ Column added successfully");
      } catch (error) {
        console.log("ℹ️ Column already exists or error:", error.message);
      }
    }

    // Show updated table structure
    const tableStructure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'transactions'
      ORDER BY ordinal_position;
    `);

    console.log("\n📋 Updated table structure:");
    tableStructure.rows.forEach((col, index) => {
      console.log(
        `${index + 1}. ${col.column_name} (${col.data_type}) - ${col.is_nullable === "YES" ? "Nullable" : "Not Null"}`
      );
    });

    // Check if there are any transactions
    const transactionCount = await client.query(
      "SELECT COUNT(*) FROM transactions"
    );
    console.log(`\n📊 Total transactions: ${transactionCount.rows[0].count}`);

    if (parseInt(transactionCount.rows[0].count) === 0) {
      console.log("📝 Creating sample transactions...");

      // Get admin user ID
      const adminUser = await client.query(
        "SELECT id FROM platform_users WHERE role = 'admin' LIMIT 1"
      );
      const adminUserId = adminUser.rows[0]?.id;

      if (adminUserId) {
        const sampleTransactions = [
          {
            user_id: adminUserId,
            amount: 99.99,
            status: "success",
            payment_method: "credit_card",
            next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
          {
            user_id: adminUserId,
            amount: 49.99,
            status: "success",
            payment_method: "paypal",
            next_billing_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          },
          {
            user_id: adminUserId,
            amount: 199.99,
            status: "pending",
            payment_method: "bank_transfer",
            next_billing_date: null,
          },
        ];

        for (const transaction of sampleTransactions) {
          await client.query(
            `
            INSERT INTO transactions (user_id, amount, status, payment_method, next_billing_date, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
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
      } else {
        console.log("⚠️ No admin user found to create sample transactions");
      }
    }

    client.release();
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await pool.end();
  }
}

fixTransactionsTable();
