const { Pool } = require("pg");

const pool = new Pool({
  connectionString:
    process.env.SUPABASE_DB_URL || "postgresql://your-connection-string",
  ssl: {
    rejectUnauthorized: false,
  },
});

async function insertTestData() {
  try {
    console.log("🔄 Inserting test data for My Learning section...");

    const client = await pool.connect();

    // First, let's check if we have any users
    const usersQuery =
      "SELECT id, email, full_name FROM platform_users LIMIT 1";
    const usersResult = await client.query(usersQuery);

    if (usersResult.rows.length === 0) {
      console.log("❌ No users found. Please create a user first.");
      return;
    }

    const testUser = usersResult.rows[0];
    console.log(`👤 Using user: ${testUser.email} (${testUser.id})`);

    // Check if we have products/courses
    const productsQuery = "SELECT id, name, type FROM products LIMIT 5";
    const productsResult = await client.query(productsQuery);

    if (productsResult.rows.length === 0) {
      console.log("📚 No products found. Creating sample products...");

      // Create sample products
      const createProductsQuery = `
        INSERT INTO products (id, name, description, type, price, status, created_at)
        VALUES
          (gen_random_uuid(), 'React Masterclass', 'Master modern React development with hooks, context, and advanced patterns', 'course', 99.99, 'active', NOW()),
          (gen_random_uuid(), 'Node.js Backend Development', 'Build scalable backend APIs with Node.js and Express', 'course', 89.99, 'active', NOW()),
          (gen_random_uuid(), 'Python Data Science', 'Learn data analysis and machine learning with Python', 'course', 79.99, 'active', NOW()),
          (gen_random_uuid(), 'The Prompt Collective', 'Join our community of prompt engineers and AI enthusiasts', 'community', 29.99, 'active', NOW()),
          (gen_random_uuid(), 'Certificate of Prompt Mastery', 'Official certification for prompt engineering skills', 'certificate', 49.99, 'active', NOW())
        RETURNING id, name, type;
      `;

      const newProducts = await client.query(createProductsQuery);
      console.log("✅ Created sample products:", newProducts.rows);

      // Update products result
      const updatedProductsResult = await client.query(productsQuery);
      productsResult.rows = updatedProductsResult.rows;
    }

    console.log(`📚 Found ${productsResult.rows.length} products`);

    // Check existing enrollments for this user
    const existingEnrollmentsQuery = `
      SELECT e.*, p.name as product_name, p.type as product_type
      FROM enrollments e
      LEFT JOIN products p ON e.product_id = p.id
      WHERE e.user_id = $1;
    `;

    const existingEnrollments = await client.query(existingEnrollmentsQuery, [
      testUser.id,
    ]);

    if (existingEnrollments.rows.length > 0) {
      console.log(
        `📊 User already has ${existingEnrollments.rows.length} enrollments:`
      );
      existingEnrollments.rows.forEach((enrollment, index) => {
        console.log(
          `  ${index + 1}. ${enrollment.product_name || "Unknown"} (${
            enrollment.product_type || "unknown"
          })`
        );
      });
    } else {
      console.log("🔄 Creating enrollments...");

      // Create enrollments for each product
      for (const product of productsResult.rows) {
        const enrollmentQuery = `
          INSERT INTO enrollments (user_id, product_id, status, enrolled_at)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (user_id, product_id) DO NOTHING
          RETURNING id;
        `;

        const enrollmentResult = await client.query(enrollmentQuery, [
          testUser.id,
          product.id,
          "ENROLLED",
          new Date().toISOString(),
        ]);

        if (enrollmentResult.rows.length > 0) {
          console.log(`✅ Enrolled in: ${product.name} (${product.type})`);

          // Create progress for this enrollment
          const progressValue = Math.floor(Math.random() * 100) + 1; // Random progress 1-100
          const progressQuery = `
            INSERT INTO progress (user_id, course_id, progress, updated_at)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id, course_id) DO UPDATE SET
              progress = EXCLUDED.progress,
              updated_at = EXCLUDED.updated_at
            RETURNING id;
          `;

          await client.query(progressQuery, [
            testUser.id,
            product.id,
            progressValue,
            new Date().toISOString(),
          ]);

          console.log(`   📈 Progress: ${progressValue}%`);
        }
      }
    }

    // Verify final state
    const finalEnrollments = await client.query(existingEnrollmentsQuery, [
      testUser.id,
    ]);
    console.log(`\n🎉 Final result:`);
    console.log(`User: ${testUser.email}`);
    console.log(`Total enrollments: ${finalEnrollments.rows.length}`);

    finalEnrollments.rows.forEach((enrollment, index) => {
      console.log(
        `  ${index + 1}. ${enrollment.product_name || "Unknown"} (${
          enrollment.product_type || "unknown"
        })`
      );
      console.log(`     Status: ${enrollment.status}`);
      console.log(`     Enrolled: ${enrollment.enrolled_at}`);
    });

    console.log(`\n🔑 Login with this user to see the data:`);
    console.log(`Email: ${testUser.email}`);
    console.log(`Password: (use the password you set when creating this user)`);

    client.release();
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await pool.end();
  }
}

// Run the script
insertTestData();
