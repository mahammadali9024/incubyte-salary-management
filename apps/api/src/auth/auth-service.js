import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { hrUsers } from '../db/schema.js';

/**
 * @param {import('../db/client.js').Db} db
 * @param {{ bcryptRounds?: number }} [options] lower rounds only in tests
 */
export function createAuthService(db, { bcryptRounds = 10 } = {}) {
  return {
    /** Creates the HR user if missing, or resets their password to the configured one. */
    ensureUser(email, password) {
      const passwordHash = bcrypt.hashSync(password, bcryptRounds);
      db.insert(hrUsers)
        .values({ email: email.toLowerCase(), passwordHash })
        .onConflictDoUpdate({ target: hrUsers.email, set: { passwordHash } })
        .run();
    },

    /** Returns the user for valid credentials, otherwise null. */
    verify(email, password) {
      const user = db
        .select()
        .from(hrUsers)
        .where(eq(hrUsers.email, String(email).toLowerCase()))
        .get();
      if (!user || !bcrypt.compareSync(String(password), user.passwordHash)) return null;
      return { id: user.id, email: user.email };
    },
  };
}
