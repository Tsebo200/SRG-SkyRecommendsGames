#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 SRG Frontend Build Verification');
console.log('=====================================\n');

// Check if all required files exist
const requiredFiles = [
  'package.json',
  'babel.config.js',
  'app/_layout.tsx',
  'app/(tabs)/index.tsx',
  'app/(tabs)/search.tsx',
  'lib/api.ts',
  'index.ts'
];

console.log('📁 Checking required files...');
let allFilesExist = true;
requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ Build verification failed: Missing required files');
  process.exit(1);
}

// Check package.json scripts
console.log('\n📦 Checking package.json scripts...');
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const requiredScripts = ['start', 'android', 'ios', 'web', 'test'];
requiredScripts.forEach(script => {
  if (packageJson.scripts[script]) {
    console.log(`✅ ${script} script exists`);
  } else {
    console.log(`❌ ${script} script missing`);
    allFilesExist = false;
  }
});

// Check dependencies
console.log('\n🔗 Checking critical dependencies...');
const criticalDeps = [
  'expo',
  'expo-router',
  'expo-blur',
  'expo-linear-gradient',
  'react',
  'react-native',
  'axios'
];

criticalDeps.forEach(dep => {
  if (packageJson.dependencies[dep]) {
    console.log(`✅ ${dep}@${packageJson.dependencies[dep]}`);
  } else {
    console.log(`❌ ${dep} - MISSING`);
    allFilesExist = false;
  }
});

// Check TypeScript configuration
console.log('\n🔧 Checking TypeScript configuration...');
if (fs.existsSync(path.join(__dirname, '..', 'tsconfig.json'))) {
  console.log('✅ tsconfig.json exists');
} else {
  console.log('❌ tsconfig.json missing');
  allFilesExist = false;
}

// Check babel configuration
console.log('\n⚙️ Checking Babel configuration...');
if (fs.existsSync(path.join(__dirname, '..', 'babel.config.js'))) {
  console.log('✅ babel.config.js exists');
} else {
  console.log('❌ babel.config.js missing');
  allFilesExist = false;
}

if (allFilesExist) {
  console.log('\n🎉 Build verification passed! All required files and configurations are present.');
  console.log('\n📱 To start the app:');
  console.log('   npm start');
  console.log('\n📱 To run on specific platforms:');
  console.log('   npm run ios     # iOS Simulator');
  console.log('   npm run android # Android Emulator');
  console.log('   npm run web     # Web Browser');
} else {
  console.log('\n❌ Build verification failed. Please fix the issues above.');
  process.exit(1);
}
