// Test login credentials to see which ones work
const { createClient } = require('@supabase/supabase-js');

async function testCredentials() {
  console.log('🔐 Testing Login Credentials...\n');

  const supabaseUrl = 'http://127.0.0.1:54321';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
  
  const supabase = createClient(supabaseUrl, anonKey);

  const testCredentials = [
    { email: 'user@test.com', password: 'password123' },
    { email: 'test@example.com', password: 'testpassword123' },
    { email: 'admin@mail.com', password: 'password123' },
    { email: 'testuser1760778006499@example.com', password: 'testpassword123' }
  ];

  for (const cred of testCredentials) {
    try {
      console.log(`Testing: ${cred.email}...`);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cred.email,
        password: cred.password
      });

      if (error) {
        console.log(`❌ ${cred.email}: ${error.message}`);
      } else {
        console.log(`✅ ${cred.email}: SUCCESS!`);
        console.log(`   User ID: ${data.user?.id}`);
        break; // Found working credentials
      }
    } catch (err) {
      console.log(`❌ ${cred.email}: ${err.message}`);
    }
  }
}

testCredentials().catch(console.error);
