// Toggle between localhost and IP address for testing
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, 'frontend/SRG/.env');

// Read current .env file
let currentContent = '';
if (fs.existsSync(envPath)) {
  currentContent = fs.readFileSync(envPath, 'utf8');
}

const localhostContent = `EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0`;

const ipContent = `EXPO_PUBLIC_SUPABASE_URL=http://10.0.0.18:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0`;

// Determine current mode and toggle
if (currentContent.includes('127.0.0.1')) {
  // Currently localhost, switch to IP
  fs.writeFileSync(envPath, ipContent);
  console.log('🔄 Switched to IP Address Mode');
  console.log('   Supabase URL: http://10.0.0.18:54321');
  console.log('   📱 Use this for Physical Device testing');
  console.log('   🔄 Run: npm start -c');
} else {
  // Currently IP, switch to localhost
  fs.writeFileSync(envPath, localhostContent);
  console.log('🔄 Switched to Localhost Mode');
  console.log('   Supabase URL: http://127.0.0.1:54321');
  console.log('   💻 Use this for Simulator testing');
  console.log('   🔄 Run: npm start -c');
}

console.log('\n📱 Testing Instructions:');
console.log('1. Restart Expo: npm start -c');
console.log('2. Use credentials: user@test.com / password123');
console.log('3. Test favourites feature');
