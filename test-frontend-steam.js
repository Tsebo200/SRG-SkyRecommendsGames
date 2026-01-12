#!/usr/bin/env node

/**
 * Complete Frontend Test for Steam Recommendations
 * This tests the exact flow that happens in the React Native app
 */

console.log('🧪 Complete Frontend Steam Recommendations Test');
console.log('===============================================');

// Test the exact API call that the app makes
async function testFrontendSteamAPI() {
  console.log('\n📋 Test 1: Direct API Call (Same as App)');
  console.log('-------------------------------------------');
  
  const steamId = '76561198966715840';
  const backendUrl = 'http://10.0.0.33:8080';
  const apiUrl = `${backendUrl}/steam/recommendations/${steamId}`;
  
  console.log('🌐 API URL:', apiUrl);
  console.log('🌐 Steam ID:', steamId);
  
  try {
    const response = await fetch(apiUrl, {
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
        console.log('\n🎮 All Recommendations:');
        data.recommendations.forEach((rec, index) => {
          console.log(`${index + 1}. ${rec.gameName}`);
          console.log(`   Genre: ${rec.genre}`);
          console.log(`   Confidence: ${rec.confidence}/10`);
          console.log(`   Reason: ${rec.reason}`);
          console.log(`   Playtime: ${rec.estimatedPlaytime}`);
          console.log('');
        });
      }
      
      return data;
    } else {
      const errorText = await response.text();
      console.log('❌ API call failed');
      console.log('📋 Error response:', errorText);
      return null;
    }
  } catch (error) {
    console.error('❌ API call error:', error.message);
    return null;
  }
}

// Test Steam ID processing (same as app logic)
function testSteamIDProcessing() {
  console.log('\n📋 Test 2: Steam ID Processing (Same as App)');
  console.log('---------------------------------------------');
  
  const steamUrl = 'https://steamcommunity.com/profiles/76561198966715840/';
  console.log('🔧 Input Steam URL:', steamUrl);
  
  // Extract Steam ID (same logic as app)
  const patterns = [
    /steamcommunity\.com\/id\/([^\/]+)/,
    /steamcommunity\.com\/profiles\/(\d+)/,
    /steam\.com\/user\/([^\/]+)/
  ];
  
  let extractedId = null;
  for (const pattern of patterns) {
    const match = steamUrl.match(pattern);
    if (match) {
      extractedId = match[1];
      break;
    }
  }
  
  console.log('🔧 Extracted Steam ID:', extractedId);
  
  // Convert to Steam ID64 (same logic as app)
  if (extractedId) {
    const cleanId = extractedId.trim();
    if (cleanId.length === 17 && /^\d+$/.test(cleanId)) {
      console.log('✅ Valid Steam ID64:', cleanId);
      return cleanId;
    } else {
      console.log('❌ Invalid Steam ID64 format');
      return null;
    }
  } else {
    console.log('❌ Failed to extract Steam ID');
    return null;
  }
}

// Test complete flow
async function testCompleteFlow() {
  console.log('\n📋 Test 3: Complete Flow Test');
  console.log('------------------------------');
  
  // Step 1: Process Steam URL
  const steamId = testSteamIDProcessing();
  if (!steamId) {
    console.log('❌ Steam ID processing failed');
    return;
  }
  
  // Step 2: Make API call
  const recommendations = await testFrontendSteamAPI();
  if (!recommendations) {
    console.log('❌ API call failed');
    return;
  }
  
  // Step 3: Verify results
  console.log('\n✅ COMPLETE FLOW SUCCESS!');
  console.log('========================');
  console.log('✅ Steam ID processed correctly');
  console.log('✅ API call successful');
  console.log(`✅ ${recommendations.recommendations?.length || 0} recommendations received`);
  console.log('✅ Gaming profile detected:', recommendations.gamingProfile?.gamingLevel);
  
  console.log('\n🎯 CONCLUSION:');
  console.log('The Steam recommendations should work in the For You tab!');
  console.log('If it\'s still not working, the issue is likely in the React Native app state management.');
}

// Run all tests
testCompleteFlow().catch(console.error);







