import { openDb } from '../src/db/client.js';

/** A fresh, fully migrated in-memory database per test — fast and isolated. */
export function testDb() {
  return openDb(':memory:');
}
