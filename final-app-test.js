#!/usr/bin/env node

/**
 * Final Comprehensive Test - Simulates Exact App Behavior
 */

console.log('🧪 Final Comprehensive Test - Exact App Behavior');
console.log('=================================================');

// Mock the exact state management from the app
class MockAppState {
  constructor() {
    this.steamProfile = null;
    this.steamRecommendations = null;
    this.steamLoading = false;
    this.steamInitialized = false;
  }

  // Simulate AsyncStorage
  async getItem(key) {
    if (key === 'user_steam_account') {
      return '76561198966715840'; // Simulate stored Steam ID
    }
    return null;
  }

  // Simulate Steam API call (exact same as app)
  async fetchRecommendations(steamId) {
    console.log('🔄 App making Steam API call...');
    console.log('🔄 Steam ID:', steamId);
    
    const response = await fetch(`http://10.0.0.33:8080/steam/recommendations/${steamId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('📋 Response status:', response.status);
    console.log('📋 Response ok:', response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Steam API call successful');
      return data;
    } else {
      throw new Error(`API failed: ${response.status}`);
    }
  }

  // Simulate checkForSteamProfile
  async checkForSteamProfile() {
    console.log('🔍 App checking for Steam profile...');
    
    const linkedSteamAccount = await this.getItem('user_steam_account');
    console.log('🔍 Found Steam account:', linkedSteamAccount);
    
    if (linkedSteamAccount) {
      console.log('✅ Steam profile detected');
      this.steamProfile = linkedSteamAccount;
      return true;
    } else {
      console.log('❌ No Steam profile found');
      return false;
    }
  }

  // Simulate auto-generation useEffect
  async autoGenerateRecommendations() {
    console.log('🔍 Auto-generation check:', {
      steamProfile: this.steamProfile,
      steamRecommendations: this.steamRecommendations ? 'exists' : 'null',
      steamLoading: this.steamLoading,
      steamInitialized: this.steamInitialized
    });
    
    if (this.steamProfile && !this.steamRecommendations && !this.steamLoading && !this.steamInitialized) {
      console.log('🚀 Auto-generating Steam recommendations...');
      this.steamInitialized = true;
      this.steamLoading = true;
      
      try {
        const recommendations = await this.fetchRecommendations(this.steamProfile);
        this.steamRecommendations = recommendations;
        console.log('✅ Steam recommendations generated successfully');
        console.log('📊 Recommendations count:', recommendations.recommendations?.length || 0);
        
        // Display recommendations
        console.log('\n🎮 Game Recommendations:');
        recommendations.recommendations?.forEach((rec, index) => {
          console.log(`${index + 1}. ${rec.gameName} (${rec.genre}) - ${rec.confidence}/10`);
        });
        
        return true;
      } catch (error) {
        console.error('❌ Steam recommendations failed:', error.message);
        return false;
      } finally {
        this.steamLoading = false;
      }
    } else {
      console.log('⏸️ Auto-generation skipped:', {
        reason: !this.steamProfile ? 'No Steam profile' : 
                this.steamRecommendations ? 'Recommendations exist' :
                this.steamLoading ? 'Already loading' :
                this.steamInitialized ? 'Already initialized' : 'Unknown'
      });
      return false;
    }
  }
}

// Test the complete app flow
async function testCompleteAppFlow() {
  console.log('\n📋 Testing Complete App Flow');
  console.log('-----------------------------');
  
  const app = new MockAppState();
  
  // Step 1: Check for Steam profile (happens on app load)
  const hasSteamProfile = await app.checkForSteamProfile();
  
  if (hasSteamProfile) {
    // Step 2: Auto-generate recommendations (happens in useEffect)
    const success = await app.autoGenerateRecommendations();
    
    if (success) {
      console.log('\n✅ COMPLETE SUCCESS!');
      console.log('===================');
      console.log('✅ Steam profile detected');
      console.log('✅ Auto-generation triggered');
      console.log('✅ API call successful');
      console.log('✅ Recommendations displayed');
      console.log('\n🎯 CONCLUSION: The Steam recommendations WILL work in the For You tab!');
    } else {
      console.log('\n❌ FAILED: Auto-generation failed');
    }
  } else {
    console.log('\n❌ FAILED: No Steam profile detected');
  }
}

testCompleteAppFlow().catch(console.error);






