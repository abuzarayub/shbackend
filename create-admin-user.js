const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});

async function createAdminUser() {
  try {
    const client = await pool.connect();
    const adminEmail = "admin@skillhub.com";
    const adminPassword = "admin123";
    const adminRole = "admin";

    // Remove any existing admin user with the same email
    await client.query("DELETE FROM platform_users WHERE email = $1", [
      adminEmail,
    ]);

    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

    // Create admin user
    const insertAdminQuery = `
      INSERT INTO platform_users (id, email, full_name, password_hash, role, is_active, created_at)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW())
      RETURNING id, email, full_name, role;
    `;

    const newAdmin = await client.query(insertAdminQuery, [
      adminEmail,
      "Admin User",
      passwordHash,
      adminRole,
      true,
    ]);

    console.log("✅ Admin user created:", newAdmin.rows[0]);
    console.log("\n🔑 Use this admin user to login:");
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log(`Role: admin`);

    // Also show all users for reference
    const allUsers = await client.query(`
      SELECT email, full_name, role, is_active
      FROM platform_users
      ORDER BY role, created_at
    `);

    console.log("\n📋 All users in database:");
    allUsers.rows.forEach((user, index) => {
      console.log(
        `${index + 1}. ${user.email} (${user.role}) - ${user.is_active ? "Active" : "Inactive"}`
      );
    });

    client.release();
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await pool.end();
  }
}

createAdminUser();
