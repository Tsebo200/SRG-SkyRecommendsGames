module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/__tests__/**/build-verification.test.js',
    '**/__tests__/**/scanner-race-condition.test.js',
    '**/__tests__/**/scanner-single-scan-simple.test.js',
    '**/__tests__/**/scan-results-single-load-simple.test.js'
  ],
  setupFiles: ['<rootDir>/jest.env.js'],
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(axios)/)',
  ],
};
