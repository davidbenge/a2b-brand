module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/actions'],
  testMatch: ['**/test/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.actions.json'
    }]
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'src/actions/**/*.ts',
    '!src/actions/**/*.d.ts',
    '!src/actions/test/**',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js', '<rootDir>/src/actions/test/mocks/jest.setup.ts'],
  testPathIgnorePatterns: ['/node_modules/'],
  transformIgnorePatterns: [
    'node_modules/(?!(ts-jest)/)'
  ],
};
