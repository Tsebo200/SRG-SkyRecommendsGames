#!/usr/bin/env node

/**
 * Complete Steam Integration Test for For You Tab
 * This simulates the exact flow that happens in recommendations.tsx
 */

console.log('🧪 Complete Steam Integration Test for For You Tab');
console.log('==================================================');

// Mock AsyncStorage
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
        console.log(`🌐   → Games: ${data.recommendations?.map(r => r.gameName).join(', ') || 'None'}`);
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

// Simulate the recommendations.tsx flow
async function simulateForYouTabFlow() {
  console.log('\n📋 Step 1: Simulate Profile Screen - Save Steam Account');
  console.log('------------------------------------------------------');
  
  // Simulate user entering Steam URL in profile screen
  const steamUrl = 'https://steamcommunity.com/profiles/76561198966715840/';
  console.log(`👤 User enters Steam URL: ${steamUrl}`);
  
  // Simulate handleSteamAccountSave logic
  console.log('🔄 Processing Steam input:', steamUrl);
  let processedSteamId = steamUrl.trim();
  
  if (steamUrl.includes('steamcommunity.com') || steamUrl.includes('steam.com')) {
    console.log('🔄 Detected Steam URL, extracting Steam ID...');
    const extractedId = mockSteamAPIService.extractSteamIdFromUrl(steamUrl);
    if (!extractedId) {
      console.log('❌ Invalid Steam profile URL');
      return;
    }
    processedSteamId = extractedId;
    console.log('🔄 Using extracted Steam ID:', processedSteamId);
  }
  
  // Convert to Steam ID64
  console.log('🔄 Converting to Steam ID64...');
  const steamId64 = mockSteamAPIService.convertToSteamId64(processedSteamId);
  if (!steamId64) {
    console.log('❌ Invalid Steam ID format');
    return;
  }
  
  // Save to AsyncStorage
  console.log('🔄 Saving Steam ID64 to storage:', steamId64);
  await mockAsyncStorage.setItem('user_steam_account', steamId64);
  
  // Verify save
  const verifySave = await mockAsyncStorage.getItem('user_steam_account');
  console.log('🔍 Verification - Steam account after save:', verifySave);
  console.log('✅ Steam account saved successfully');
  
  console.log('\n📋 Step 2: Simulate For You Tab - Load Steam Account');
  console.log('----------------------------------------------------');
  
  // Simulate checkForSteamProfile in recommendations.tsx
  const linkedSteamAccount = await mockAsyncStorage.getItem('user_steam_account');
  console.log('🔍 Checking for Steam profile in AsyncStorage:', linkedSteamAccount);
  
  let steamProfile = null;
  
  if (linkedSteamAccount) {
    console.log('✅ Found linked Steam account:', linkedSteamAccount);
    
    if (linkedSteamAccount.includes('steamcommunity.com') || linkedSteamAccount.includes('steam.com')) {
      console.log('🔄 Found Steam URL in storage, processing...');
      const extractedId = mockSteamAPIService.extractSteamIdFromUrl(linkedSteamAccount);
      if (extractedId) {
        const steamId64 = mockSteamAPIService.convertToSteamId64(extractedId);
        console.log('🔄 Processed Steam ID64:', steamId64);
        await mockAsyncStorage.setItem('user_steam_account', steamId64);
        steamProfile = steamId64;
        console.log('✅ Updated Steam account with processed ID64');
      }
    } else {
      console.log('✅ Using Steam ID directly:', linkedSteamAccount);
      steamProfile = linkedSteamAccount;
    }
  } else {
    console.log('❌ No Steam account found in AsyncStorage');
  }
  
  console.log('\n📋 Step 3: Simulate Auto-Generation of Recommendations');
  console.log('-----------------------------------------------------');
  
  if (steamProfile) {
    console.log('🔍 Auto-generation check:', {
      steamProfile: steamProfile,
      steamRecommendations: 'null',
      steamLoading: false,
      steamInitialized: false
    });
    
    console.log('🚀 Auto-generating Steam recommendations...');
    try {
      const recommendations = await mockSteamAPIService.getPersonalisedRecommendations(steamProfile);
      console.log('✅ Steam recommendations generated successfully');
      console.log(`📊 Found ${recommendations.recommendations?.length || 0} recommendations`);
      
      // Display recommendations
      console.log('\n🎮 Game Recommendations:');
      console.log('========================');
      recommendations.recommendations?.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec.gameName}`);
        console.log(`   Genre: ${rec.genre}`);
        console.log(`   Confidence: ${rec.confidence}/10`);
        console.log(`   Reason: ${rec.reason}`);
        console.log(`   Estimated Playtime: ${rec.estimatedPlaytime}`);
        console.log('');
      });
      
      console.log('✅ COMPLETE SUCCESS - Steam recommendations working!');
      
    } catch (error) {
      console.log('❌ Steam recommendations failed:', error.message);
    }
  } else {
    console.log('❌ No Steam profile available for recommendations');
  }
}

// Run the test
simulateForYouTabFlow().catch(console.error);






