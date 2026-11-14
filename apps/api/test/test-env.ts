/**
 * Point the tests at their own SQLite file, never `prisma/dev.db`.
 *
 * Loaded through jest's `setupFiles`, so it runs before a test file imports
 * PrismaClient: the client reads DATABASE_URL when it is constructed, and
 * setting it afterwards would be too late.
 *
 * Prisma resolves a relative `file:` URL against the `prisma/` folder, so this
 * is `apps/api/prisma/test.db` — covered by the `*.db` rule in .gitignore.
 */
export const TEST_DATABASE_URL = 'file:./test.db';

process.env.DATABASE_URL = TEST_DATABASE_URL;
