const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});

async function fixRealData() {
  try {
    const client = await pool.connect();

    console.log("🔍 Checking your real database...");

    // Get a real student user
    const studentUser = await client.query(`
      SELECT id, email, full_name, role
      FROM platform_users
      WHERE role = 'student'
      LIMIT 1
    `);

    if (studentUser.rows.length === 0) {
      console.log(
        "❌ No student users found. Please create a student user first."
      );
      return;
    }

    const realUser = studentUser.rows[0];
    console.log("✅ Found real user:", realUser);

    // Check if user has enrollments
    const existingEnrollments = await client.query(
      `
      SELECT * FROM enrollments WHERE user_id = $1
    `,
      [realUser.id]
    );

    console.log(
      `📚 User has ${existingEnrollments.rows.length} existing enrollments`
    );

    // Get available products
    const products = await client.query(`
      SELECT id, type, status FROM products WHERE status = 'active' LIMIT 3
    `);

    console.log(`🛍️ Found ${products.rows.length} available products`);

    // Create enrollments if none exist
    if (existingEnrollments.rows.length === 0 && products.rows.length > 0) {
      console.log("🔄 Creating enrollments for real user...");

      for (const product of products.rows) {
        await client.query(
          `
          INSERT INTO enrollments (user_id, product_id, status, enrolled_at)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (user_id, product_id) DO NOTHING
        `,
          [realUser.id, product.id, "ENROLLED", new Date().toISOString()]
        );

        console.log(`✅ Enrolled in product ${product.id} (${product.type})`);

        // Create progress
        const progressValue = Math.floor(Math.random() * 100) + 1;
        await client.query(
          `
          INSERT INTO progress (user_id, course_id, progress, updated_at)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (user_id, course_id) DO UPDATE SET
            progress = EXCLUDED.progress,
            updated_at = EXCLUDED.updated_at
        `,
          [realUser.id, product.id, progressValue, new Date().toISOString()]
        );

        console.log(`✅ Created progress: ${progressValue}%`);
      }
    }

    // Verify final state
    const finalEnrollments = await client.query(
      `
      SELECT e.*, p.type as product_type
      FROM enrollments e
      LEFT JOIN products p ON e.product_id = p.id
      WHERE e.user_id = $1
    `,
      [realUser.id]
    );

    console.log(`\n🎉 Final result:`);
    console.log(`User: ${realUser.email} (${realUser.id})`);
    console.log(`Enrollments: ${finalEnrollments.rows.length}`);

    finalEnrollments.rows.forEach((enrollment, index) => {
      console.log(
        `  ${index + 1}. Product: ${enrollment.product_id} (${enrollment.product_type})`
      );
      console.log(`     Status: ${enrollment.status}`);
    });

    console.log(`\n🔑 Use this user to login:`);
    console.log(`Email: ${realUser.email}`);
    console.log(`Password: (use the password you set for this user)`);

    client.release();
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await pool.end();
  }
}

fixRealData();
