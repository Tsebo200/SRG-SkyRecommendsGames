// Create a simple test user with easy credentials
const { createClient } = require('@supabase/supabase-js');

async function createSimpleUser() {
  console.log('🔐 Creating Simple Test User...\n');

  const supabaseUrl = 'http://127.0.0.1:54321';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
  
  const supabase = createClient(supabaseUrl, anonKey);

  const testEmail = 'user@test.com';
  const testPassword = 'password123';

  try {
    console.log('1. 📧 Creating simple user...');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    });

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        console.log('⚠️  User already exists, trying to sign in...');
        
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: testPassword
        });

        if (signInError) {
          console.log('❌ Sign in error:', signInError.message);
          return;
        }

        console.log('✅ Sign in successful!');
        console.log(`   User ID: ${signInData.user?.id}`);
        console.log(`   Email: ${signInData.user?.email}`);
        
        console.log('\n📱 Use these credentials in your app:');
        console.log(`   Email: ${testEmail}`);
        console.log(`   Password: ${testPassword}`);
        return;
      } else {
        console.log('❌ Sign up error:', signUpError.message);
        return;
      }
    }

    console.log('✅ User created successfully!');
    console.log(`   User ID: ${signUpData.user?.id}`);

    console.log('\n2. 🔑 Testing sign in...');
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (signInError) {
      console.log('❌ Sign in error:', signInError.message);
      return;
    }

    console.log('✅ Sign in successful!');
    console.log(`   User ID: ${signInData.user?.id}`);
    console.log(`   Email: ${signInData.user?.email}`);

    console.log('\n🎉 Simple user created successfully!');
    console.log('\n📱 Use these credentials in your app:');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

// Run the test
createSimpleUser().catch(console.error);
