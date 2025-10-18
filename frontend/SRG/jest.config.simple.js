module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/build-verification.test.js'],
  setupFiles: ['<rootDir>/jest.env.js'],
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(axios)/)',
  ],
};
