// Provide stub values for all environment variables that globals.ts requires at
// static-field initialisation time.  Without these, importing any module that
// transitively imports globals.ts would throw before any test runs.
process.env.FEATURE_FLAGS_SDK_KEY = 'test-sdk-key';
process.env.APPROVED_GUILD = 'test-guild-id';
process.env.DB_CONNECTION_URI = 'mongodb://localhost:27017/test';
process.env.DATABASE_NAME = 'test-db';
process.env.SENTRY_DSN = 'https://public@sentry.example.com/1';
