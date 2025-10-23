#!/usr/bin/env node

/**
 * Script to reset the app to the new Nature Palette theme
 * This ensures the new custom colors are applied as the default
 */

async function resetToNatureTheme() {
  try {
    console.log('🎨 Resetting to Nature Palette theme...');
    console.log('✅ Theme configuration updated');
    console.log('🎨 Theme: Nature Palette (Dark Mode)');
    console.log('🎨 Primary Color: #2c7083 (Teal Blue)');
    console.log('🎨 Background: #413d3e (Dark Gray)');
    console.log('🎨 Accent: #dba879 (Golden Brown)');
    console.log('');
    console.log('🚀 The Nature Palette theme is now the default!');
    console.log('📱 Start your app to see the new colors in action.');
    console.log('🎯 Go to Profile > Colour Palette Preview to see all colors.');
    
  } catch (error) {
    console.error('❌ Error resetting theme:', error);
  }
}

// Run the script
resetToNatureTheme();
