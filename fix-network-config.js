// Fix network configuration for physical device testing
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Network Configuration...\n');

// Your computer's IP address
const COMPUTER_IP = '10.0.0.18';

// Update .env file with IP address
const envPath = path.join(__dirname, 'frontend/SRG/.env');
const envContent = `EXPO_PUBLIC_SUPABASE_URL=http://${COMPUTER_IP}:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0`;

fs.writeFileSync(envPath, envContent);

console.log('✅ Updated .env file with IP address:');
console.log(`   Supabase URL: http://${COMPUTER_IP}:54321`);
console.log('   Anon Key: [Updated]');

console.log('\n📱 For Physical Device Testing:');
console.log('1. Restart Expo: npm start -c');
console.log('2. Scan QR code with Expo Go app');
console.log('3. Use credentials: user@test.com / password123');

console.log('\n💻 For Simulator Testing:');
console.log('1. Use localhost version (revert .env to localhost)');
console.log('2. Press "i" for iOS simulator or "a" for Android');

console.log('\n🔄 To switch between localhost and IP:');
console.log('   Run: node fix-network-config.js');
console.log('   This script toggles between localhost and IP address');
