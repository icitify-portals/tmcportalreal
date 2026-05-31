import { db } from '../lib/db';
import { users } from '../lib/db/schema';
import { desc, isNotNull } from 'drizzle-orm';

import { like } from 'drizzle-orm';
async function run() {
  const result = await db.select({id: users.id, image: users.image})
    .from(users)
    .where(like(users.image, 'https%'))
    .orderBy(desc(users.updatedAt))
    .limit(3);
  console.log(result);
}

run().catch(console.error).finally(() => process.exit(0));
