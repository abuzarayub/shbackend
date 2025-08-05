const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: {
    rejectUnauthorized: false,
  },
}); 

async function createTestData() {
  try {
    console.log("🔄 Creating real test data...");

    const client = await pool.connect();

    // First, let's check what tables we have and their structure
    const tablesQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('products', 'courses', 'enrollments', 'progress', 'platform_users')
      ORDER BY table_name;
    `;

    const tablesResult = await client.query(tablesQuery);
    console.log(
      "\n📋 Available tables:",
      tablesResult.rows.map((r) => r.table_name)
    );

    // Check if we have any products/courses
    const productsQuery = `
      SELECT id, type, status, created_at
      FROM products
      LIMIT 5;
    `;

    const productsResult = await client.query(productsQuery);
    console.log(`\n📚 Found ${productsResult.rows.length} existing products`);

    if (productsResult.rows.length === 0) {
      console.log("❌ No products found. Creating test products...");

      // Create test products
      const insertProductQuery = `
        INSERT INTO products (id, type, status, created_at)
        VALUES
          (gen_random_uuid(), 'course', 'active', NOW()),
          (gen_random_uuid(), 'course', 'active', NOW()),
          (gen_random_uuid(), 'workshop', 'active', NOW())
        RETURNING id, type;
      `;

      const newProducts = await client.query(insertProductQuery);
      console.log("✅ Created test products:", newProducts.rows);
    }

    // Get the test user ID (from the logs, I can see it's being used)
    const testUserId = "197071ff-9ad1-46c2-b68a-deb4271f4130";

    // Check if user exists
    const userQuery = `
      SELECT id, email, full_name, role
      FROM platform_users
      WHERE id = $1;
    `;

    const userResult = await client.query(userQuery, [testUserId]);

    if (userResult.rows.length === 0) {
      console.log("❌ Test user not found. Creating test user...");

      const insertUserQuery = `
        INSERT INTO platform_users (id, email, full_name, password_hash, role, is_active, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (id) DO NOTHING;
      `;

      await client.query(insertUserQuery, [
        testUserId,
        "test@example.com",
        "Test User",
        "hashed_password",
        "student",
        true,
      ]);

      console.log("✅ Created test user");
    } else {
      console.log("✅ Test user exists:", userResult.rows[0]);
    }

    // Get products to enroll in
    const availableProductsQuery = `
      SELECT id, type, status
      FROM products
      WHERE status = 'active'
      LIMIT 3;
    `;

    const availableProducts = await client.query(availableProductsQuery);
    console.log(
      `\n📚 Available products for enrollment:`,
      availableProducts.rows
    );

    if (availableProducts.rows.length > 0) {
      // Create enrollments
      console.log("\n🔄 Creating enrollments...");

      for (let i = 0; i < availableProducts.rows.length; i++) {
        const product = availableProducts.rows[i];

        const enrollmentQuery = `
          INSERT INTO enrollments (user_id, product_id, status, enrolled_at)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (user_id, product_id) DO NOTHING
          RETURNING id;
        `;

        const enrollmentResult = await client.query(enrollmentQuery, [
          testUserId,
          product.id,
          "ENROLLED",
          new Date().toISOString(),
        ]);

        if (enrollmentResult.rows.length > 0) {
          console.log(`✅ Enrolled in product ${product.id} (${product.type})`);

          // Create progress for this enrollment
          const progressQuery = `
            INSERT INTO progress (user_id, course_id, progress, updated_at)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
              progress = EXCLUDED.progress,
              updated_at = EXCLUDED.updated_at
            RETURNING id;
          `;

          const progressValue = Math.floor(Math.random() * 100) + 1; // Random progress 1-100

          await client.query(progressQuery, [
            testUserId,
            product.id,
            progressValue,
            new Date().toISOString(),
          ]);

          console.log(`✅ Created progress: ${progressValue}%`);
        }
      }
    }

    // Verify the data was created
    const verifyEnrollmentsQuery = `
      SELECT e.*, p.type as product_type
      FROM enrollments e
      LEFT JOIN products p ON e.product_id = p.id
      WHERE e.user_id = $1;
    `;

    const enrollments = await client.query(verifyEnrollmentsQuery, [
      testUserId,
    ]);
    console.log(`\n📊 Created ${enrollments.rows.length} enrollments:`);
    enrollments.rows.forEach((enrollment, index) => {
      console.log(
        `  ${index + 1}. Product: ${enrollment.product_id} (${enrollment.product_type})`
      );
      console.log(`     Status: ${enrollment.status}`);
      console.log(`     Enrolled: ${enrollment.enrolled_at}`);
    });

    const verifyProgressQuery = `
      SELECT p.*
      FROM progress p
      WHERE p.user_id = $1;
    `;

    const progress = await client.query(verifyProgressQuery, [testUserId]);
    console.log(`\n📈 Created ${progress.rows.length} progress records:`);
    progress.rows.forEach((prog, index) => {
      console.log(`  ${index + 1}. Course: ${prog.course_id}`);
      console.log(`     Progress: ${prog.progress}%`);
      console.log(`     Updated: ${prog.updated_at}`);
    });

    client.release();
    console.log("\n🎉 Test data creation completed!");
  } catch (error) {
    console.error("❌ Error creating test data:", error.message);
  } finally {
    await pool.end();
  }
}

createTestData();
