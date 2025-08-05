const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function checkEnrollments() {
  try {
    console.log("🔍 Checking existing enrollments...");

    const client = await pool.connect();

    // First, let's check the products table structure
    const productsStructureQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'products'
      ORDER BY ordinal_position;
    `;

    const productsStructureResult = await client.query(productsStructureQuery);
    console.log("\n📋 Products table structure:");
    productsStructureResult.rows.forEach((row) => {
      console.log(
        `  - ${row.column_name}: ${row.data_type} (${row.is_nullable === "YES" ? "nullable" : "not null"})`
      );
    });

    // Check existing enrollments
    const enrollmentsQuery = `
      SELECT e.*
      FROM enrollments e
      WHERE e.user_id = 'cec68e82-6e89-4489-b842-4050453e0521'
      LIMIT 10;
    `;

    const enrollmentsResult = await client.query(enrollmentsQuery);
    console.log(
      `\n📊 Found ${enrollmentsResult.rows.length} enrollments for test user:`
    );

    if (enrollmentsResult.rows.length > 0) {
      enrollmentsResult.rows.forEach((enrollment, index) => {
        console.log(`  ${index + 1}. Product ID: ${enrollment.product_id}`);
        console.log(`     Status: ${enrollment.status}`);
        console.log(`     Enrolled: ${enrollment.enrolled_at}`);
        console.log("");
      });
    } else {
      console.log("❌ No enrollments found for test user");

      // Check if we have products to enroll in
      const productsQuery = `
        SELECT id, name, description, type
        FROM products
        WHERE status = 'active' OR status IS NULL
        LIMIT 5;
      `;

      const productsResult = await client.query(productsQuery);
      console.log(
        `\n📚 Found ${productsResult.rows.length} available products:`
      );

      if (productsResult.rows.length > 0) {
        productsResult.rows.forEach((product, index) => {
          console.log(
            `  ${index + 1}. ${product.name || "Unnamed Product"} (${product.type || "unknown"})`
          );
          console.log(`     ID: ${product.id}`);
          console.log("");
        });

        // Create test enrollments
        console.log("🔄 Creating test enrollments...");
        for (let i = 0; i < Math.min(3, productsResult.rows.length); i++) {
          const product = productsResult.rows[i];
          const insertQuery = `
            INSERT INTO enrollments (user_id, product_id, status, enrolled_at)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id, product_id) DO NOTHING;
          `;

          await client.query(insertQuery, [
            "cec68e82-6e89-4489-b842-4050453e0521",
            product.id,
            "ENROLLED",
            new Date().toISOString(),
          ]);

          console.log(`  ✅ Enrolled in: ${product.name || "Unnamed Product"}`);
        }
      }
    }

    // Check progress data
    const progressQuery = `
      SELECT p.*
      FROM progress p
      WHERE p.user_id = 'cec68e82-6e89-4489-b842-4050453e0521'
      LIMIT 10;
    `;

    const progressResult = await client.query(progressQuery);
    console.log(`\n📈 Found ${progressResult.rows.length} progress records:`);

    if (progressResult.rows.length > 0) {
      progressResult.rows.forEach((progress, index) => {
        console.log(`  ${index + 1}. Course ID: ${progress.course_id}`);
        console.log(`     Progress: ${progress.progress}%`);
        console.log(`     Updated: ${progress.updated_at}`);
        console.log("");
      });
    } else {
      console.log("❌ No progress records found");
    }

    client.release();
  } catch (error) {
    console.error("❌ Error checking enrollments:", error.message);
  } finally {
    await pool.end();
  }
}

checkEnrollments();
