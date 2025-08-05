const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});

async function createReviewsTable() {
  try {
    const client = await pool.connect();

    console.log("🔍 Checking for reviews table...");

    // Check if reviews table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'reviews'
      );
    `);

    if (tableExists.rows[0].exists) {
      console.log("✅ Reviews table already exists");

      // Show table structure
      const tableStructure = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'reviews'
        ORDER BY ordinal_position;
      `);

      console.log("\n📋 Current table structure:");
      tableStructure.rows.forEach((col, index) => {
        console.log(
          `${index + 1}. ${col.column_name} (${col.data_type}) - ${col.is_nullable === "YES" ? "Nullable" : "Not Null"}`
        );
      });
    } else {
      console.log("❌ Reviews table does not exist. Creating it...");

      // Create reviews table
      const createTableQuery = `
        CREATE TABLE reviews (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES platform_users(id),
          product_id UUID REFERENCES products(id),
          rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
          comment TEXT,
          status VARCHAR(50) NOT NULL DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `;

      await client.query(createTableQuery);
      console.log("✅ Reviews table created successfully");
    }

    // Check if there are any reviews
    const reviewCount = await client.query("SELECT COUNT(*) FROM reviews");
    console.log(`\n📊 Total reviews: ${reviewCount.rows[0].count}`);

    if (parseInt(reviewCount.rows[0].count) === 0) {
      console.log("📝 Creating sample reviews...");

      // Get admin user ID and some product IDs
      const adminUser = await client.query(
        "SELECT id FROM platform_users WHERE role = 'admin' LIMIT 1"
      );
      const products = await client.query("SELECT id FROM products LIMIT 3");

      const adminUserId = adminUser.rows[0]?.id;
      const productIds = products.rows.map((p) => p.id);

      if (adminUserId && productIds.length > 0) {
        const sampleReviews = [
          {
            user_id: adminUserId,
            product_id: productIds[0],
            rating: 5,
            comment:
              "Excellent course! Very comprehensive and well-structured.",
            status: "published",
          },
          {
            user_id: adminUserId,
            product_id: productIds[0],
            rating: 4,
            comment: "Great content, but could use more practical examples.",
            status: "pending",
          },
          {
            user_id: adminUserId,
            product_id: productIds[1] || productIds[0],
            rating: 3,
            comment: "Decent course, but some sections were confusing.",
            status: "rejected",
          },
          {
            user_id: adminUserId,
            product_id: productIds[2] || productIds[0],
            rating: 5,
            comment: "Amazing! Learned so much from this course.",
            status: "published",
          },
        ];

        for (const review of sampleReviews) {
          await client.query(
            `
            INSERT INTO reviews (user_id, product_id, rating, comment, status, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
          `,
            [
              review.user_id,
              review.product_id,
              review.rating,
              review.comment,
              review.status,
            ]
          );
        }

        console.log("✅ Sample reviews created");
      } else {
        console.log(
          "⚠️ No admin user or products found to create sample reviews"
        );
      }
    }

    // Show all reviews for reference
    const allReviews = await client.query(`
      SELECT
        r.id,
        r.rating,
        r.comment,
        r.status,
        r.created_at,
        p.title as product_title,
        u.full_name as user_name
      FROM reviews r
      LEFT JOIN products p ON r.product_id = p.id
      LEFT JOIN platform_users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
    `);

    console.log("\n📋 All reviews in database:");
    allReviews.rows.forEach((review, index) => {
      console.log(
        `${index + 1}. Rating: ${review.rating}/5, Status: ${review.status}, Product: ${review.product_title}, User: ${review.user_name}`
      );
    });

    client.release();
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await pool.end();
  }
}

createReviewsTable();
