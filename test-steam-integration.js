#!/usr/bin/env node

/**
 * Comprehensive test for Steam integration in recommendations screen
 * This simulates the exact flow that happens in recommendations.tsx
 */

console.log('🧪 Steam Integration Test Suite');
console.log('================================');

// Mock AsyncStorage for testing
const mockAsyncStorage = {
  data: new Map(),
  async getItem(key) {
    console.log(`📱 AsyncStorage.getItem("${key}")`);
    const value = this.data.get(key);
    console.log(`📱   → ${value || 'null'}`);
    return value || null;
  },
  async setItem(key, value) {
    console.log(`📱 AsyncStorage.setItem("${key}", "${value}")`);
    this.data.set(key, value);
  },
  async getAllKeys() {
    console.log(`📱 AsyncStorage.getAllKeys()`);
    const keys = Array.from(this.data.keys());
    console.log(`📱   → [${keys.map(k => `"${k}"`).join(', ')}]`);
    return keys;
  }
};

// Mock SteamAPIService
const mockSteamAPIService = {
  extractSteamIdFromUrl(url) {
    console.log(`🔧 SteamAPIService.extractSteamIdFromUrl("${url}")`);
    const patterns = [
      /steamcommunity\.com\/id\/([^\/]+)/,
      /steamcommunity\.com\/profiles\/(\d+)/,
      /steam\.com\/user\/([^\/]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        console.log(`🔧   → Extracted: ${match[1]}`);
        return match[1];
      }
    }
    console.log(`🔧   → No match found`);
    return null;
  },
  
  convertToSteamId64(steamId) {
    console.log(`🔧 SteamAPIService.convertToSteamId64("${steamId}")`);
    const cleanId = steamId.trim();
    if (cleanId.length === 17 && /^\d+$/.test(cleanId)) {
      console.log(`🔧   → Valid Steam ID64: ${cleanId}`);
      return cleanId;
    }
    console.log(`🔧   → Invalid Steam ID64 format`);
    return null;
  },
  
  async getPersonalisedRecommendations(steamId) {
    console.log(`🌐 SteamAPIService.getPersonalisedRecommendations("${steamId}")`);
    
    try {
      const response = await fetch(`http://10.0.0.33:8080/steam/recommendations/${steamId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`🌐   → Success: ${data.recommendations?.length || 0} recommendations`);
        return data;
      } else {
        const errorText = await response.text();
        console.log(`🌐   → Error ${response.status}: ${errorText}`);
        throw new Error(`Recommendations API request failed: ${response.status}`);
      }
    } catch (error) {
      console.log(`🌐   → Network error: ${error.message}`);
      throw error;
    }
  }
};

// Test scenarios
async function runTests() {
  console.log('\n📋 Test 1: Fresh Steam URL in AsyncStorage');
  console.log('--------------------------------------------');
  
  // Simulate storing a Steam URL
  await mockAsyncStorage.setItem('user_steam_account', 'https://steamcommunity.com/profiles/76561198966715840/');
  
  // Simulate checkForSteamProfile
  const linkedSteamAccount = await mockAsyncStorage.getItem('user_steam_account');
  console.log(`🔍 Found Steam account: ${linkedSteamAccount}`);
  
  if (linkedSteamAccount && linkedSteamAccount.includes('steamcommunity.com')) {
    console.log('🔄 Processing Steam URL...');
    const extractedId = mockSteamAPIService.extractSteamIdFromUrl(linkedSteamAccount);
    if (extractedId) {
      const steamId64 = mockSteamAPIService.convertToSteamId64(extractedId);
      if (steamId64) {
        await mockAsyncStorage.setItem('user_steam_account', steamId64);
        console.log('✅ Updated Steam account with processed ID64');
        
        // Test API call
        console.log('\n📋 Test 2: API Call with Processed Steam ID');
        console.log('--------------------------------------------');
        try {
          const recommendations = await mockSteamAPIService.getPersonalisedRecommendations(steamId64);
          console.log('✅ Steam recommendations generated successfully');
          console.log(`📊 Found ${recommendations.recommendations?.length || 0} recommendations`);
        } catch (error) {
          console.log('❌ Steam recommendations failed:', error.message);
        }
      }
    }
  }
  
  console.log('\n📋 Test 3: Direct Steam ID64 in AsyncStorage');
  console.log('---------------------------------------------');
  
  // Clear and test with direct ID64
  mockAsyncStorage.data.clear();
  await mockAsyncStorage.setItem('user_steam_account', '76561198966715840');
  
  const directSteamId = await mockAsyncStorage.getItem('user_steam_account');
  console.log(`🔍 Found Steam ID: ${directSteamId}`);
  
  if (directSteamId && !directSteamId.includes('steamcommunity.com')) {
    console.log('✅ Using Steam ID directly');
    
    // Test API call
    try {
      const recommendations = await mockSteamAPIService.getPersonalisedRecommendations(directSteamId);
      console.log('✅ Steam recommendations generated successfully');
      console.log(`📊 Found ${recommendations.recommendations?.length || 0} recommendations`);
    } catch (error) {
      console.log('❌ Steam recommendations failed:', error.message);
    }
  }
  
  console.log('\n📋 Test 4: Empty AsyncStorage');
  console.log('----------------------------');
  
  mockAsyncStorage.data.clear();
  const emptySteamAccount = await mockAsyncStorage.getItem('user_steam_account');
  console.log(`🔍 Steam account: ${emptySteamAccount || 'None'}`);
  console.log('❌ No Steam account found - recommendations will not work');
  
  console.log('\n✅ Test Suite Complete');
  console.log('======================');
}

runTests().catch(console.error);



