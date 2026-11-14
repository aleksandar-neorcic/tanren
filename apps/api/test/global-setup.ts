import { execFileSync } from 'node:child_process';
import { TEST_DATABASE_URL } from './test-env';

/**
 * Make sure the test database exists and matches the schema, once per run.
 *
 * `db push` rather than `migrate deploy`: tests do not care about migration
 * history, only about the shape of the tables. It is additive and safe to run
 * against an existing file -- the suites empty the tables themselves in
 * `beforeEach`, so nothing here needs to destroy data.
 */
export default function globalSetup(): void {
  // A guard, not a formality: this command writes to whatever DATABASE_URL
  // points at, and pointing it at dev.db would rewrite real data.
  if (!TEST_DATABASE_URL.includes('test.db')) {
    throw new Error(`Refusing to touch a database that is not the test one: ${TEST_DATABASE_URL}`);
  }

  execFileSync('npx', ['prisma', 'db', 'push', '--skip-generate'], {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: 'inherit',
  });
}
