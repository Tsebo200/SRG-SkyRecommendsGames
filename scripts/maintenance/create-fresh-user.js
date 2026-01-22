// Create a fresh user with simple credentials
const { createClient } = require('@supabase/supabase-js');

async function createFreshUser() {
  console.log('🔐 Creating Fresh User...\n');

  const supabaseUrl = 'http://127.0.0.1:54321';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
  
  const supabase = createClient(supabaseUrl, anonKey);

  const email = 'test@example.com';
  const password = 'password123';

  try {
    console.log(`Creating user: ${email}`);
    
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password
    });

    if (error) {
      if (error.message.includes('already registered')) {
        console.log('User already exists, testing login...');
        
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: password
        });

        if (signInError) {
          console.log('❌ Login failed:', signInError.message);
        } else {
          console.log('✅ Login successful!');
          console.log(`   User ID: ${signInData.user?.id}`);
        }
      } else {
        console.log('❌ Sign up error:', error.message);
      }
    } else {
      console.log('✅ User created successfully!');
      console.log(`   User ID: ${data.user?.id}`);
    }

    console.log('\n📱 Use these credentials in your app:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);

  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

createFreshUser().catch(console.error);
