#!/usr/bin/env node

/**
 * Quick verification test for Steam account in app
 */

console.log('🔍 Quick Steam Account Verification');
console.log('===================================');

// Test if we can simulate the exact AsyncStorage key
const testSteamId = '76561198966715840';

console.log('📋 Test Steam ID:', testSteamId);
console.log('📋 Steam ID length:', testSteamId.length);
console.log('📋 Steam ID format valid:', /^\d{17}$/.test(testSteamId));

// Test the exact API call that the app makes
async function testAppAPICall() {
  console.log('\n🌐 Testing App API Call');
  console.log('------------------------');
  
  try {
    const response = await fetch(`http://10.0.0.33:8080/steam/recommendations/${testSteamId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('📋 Response status:', response.status);
    console.log('📋 Response ok:', response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API call successful');
      console.log('📋 Recommendations count:', data.recommendations?.length || 0);
      console.log('📋 Gaming profile:', data.gamingProfile?.gamingLevel || 'Unknown');
      
      if (data.recommendations?.length > 0) {
        console.log('\n🎮 First 3 Recommendations:');
        data.recommendations.slice(0, 3).forEach((rec, index) => {
          console.log(`${index + 1}. ${rec.gameName} (${rec.genre}) - ${rec.confidence}/10`);
        });
      }
      
      console.log('\n✅ VERIFICATION SUCCESSFUL');
      console.log('The Steam account should work in the For You tab!');
      
    } else {
      console.log('❌ API call failed');
      const errorText = await response.text();
      console.log('📋 Error response:', errorText);
    }
  } catch (error) {
    console.error('❌ API call error:', error.message);
  }
}

testAppAPICall();

