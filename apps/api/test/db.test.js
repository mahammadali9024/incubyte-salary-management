import { describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import { testDb } from './db.js';

describe('database migrations', () => {
  it('create the expected tables on a fresh database', () => {
    const tables = testDb()
      .all(sql`select name from sqlite_master where type = 'table' order by name`)
      .map((t) => t.name);

    expect(tables).toEqual(expect.arrayContaining(['employees', 'salary_changes', 'hr_users']));
  });
});
