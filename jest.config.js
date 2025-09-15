module.exports = {
  projects: [
    {
      displayName: 'web',
      testMatch: ['<rootDir>/apps/web/**/*.test.{js,ts,tsx}'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/apps/web/jest.setup.js'],
      moduleNameMapping: {
        '^@/(.*)$': '<rootDir>/apps/web/$1',
        '^@packages/shared/(.*)$': '<rootDir>/packages/shared/src/$1',
      },
    },
    {
      displayName: 'api',
      testMatch: ['<rootDir>/apps/api/**/*.test.{js,ts}'],
      testEnvironment: 'node',
      moduleNameMapping: {
        '^@/(.*)$': '<rootDir>/apps/api/src/$1',
        '^@packages/shared/(.*)$': '<rootDir>/packages/shared/src/$1',
      },
    },
    {
      displayName: 'cv-matching',
      testMatch: ['<rootDir>/services/cv-matching/**/*.test.{js,ts}'],
      testEnvironment: 'node',
    },
  ],
  collectCoverageFrom: [
    'apps/**/*.{js,ts,tsx}',
    'services/**/*.{js,ts}',
    'packages/**/*.{js,ts}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/build/**',
    '!**/.next/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
};
