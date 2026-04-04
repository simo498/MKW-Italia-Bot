/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  // Provide required env vars before any module is loaded so that globals.ts
  // static-field initialisers do not throw.
  setupFiles: ['<rootDir>/src/__tests__/setup.ts'],
  // Strip explicit .js extensions used in ESM-style imports so that Jest's
  // CommonJS resolver can locate the corresponding .ts source files.
  moduleNameMapper: {
    '^(\\.\\.?/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        target: 'ES2020',
        module: 'commonjs',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
      },
    }],
  },
};
