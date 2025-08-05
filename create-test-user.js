const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUser() {
  try {
    // Create a test user
    const { data: user, error: userError } = await supabase.auth.admin.createUser({
      email: 'test@example.com',
      password: 'testpassword123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Test User',
        role: 'student'
      }
    });

    if (userError) {
      console.error('Error creating user:', userError);
      return;
    }

    console.log('✅ Test user created successfully:');
    console.log('Email: test@example.com');
    console.log('Password: testpassword123');
    console.log('User ID:', user.user.id);

    // Create a JWT token for testing
    const { data: { session }, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: 'test@example.com',
    });

    if (sessionError) {
      console.error('Error generating session:', sessionError);
      return;
    }

    console.log('\n🔑 Test JWT Token:');
    console.log(session.access_token);

  } catch (error) {
    console.error('Error:', error);
  }
}

createTestUser();
