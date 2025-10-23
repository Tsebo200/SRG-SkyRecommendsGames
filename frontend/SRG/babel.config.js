module.exports = function(api) {
  api.cache(true);
  
  const isTest = process.env.NODE_ENV === 'test';
  
  if (isTest) {
    // Simplified config for testing to avoid reanimated worklets
    return {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-typescript',
        '@babel/preset-react'
      ],
      plugins: [],
    };
  }
  
  // Full config for development and production
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin', // Must be last
    ],
  };
};