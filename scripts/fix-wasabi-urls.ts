import { db } from '../lib/db';
import { users } from '../lib/db/schema';
import { like } from 'drizzle-orm';

async function run() {
  const result = await db.select({id: users.id, image: users.image})
    .from(users)
    .where(like(users.image, 'https://s3.eu-west-1.wasabisys.com/tmcbackup/%'));
    
  console.log(`Found ${result.length} users with Wasabi URLs.`);

  for (const user of result) {
    if (user.image) {
      const key = user.image.replace('https://s3.eu-west-1.wasabisys.com/tmcbackup/', '');
      const newUrl = `/api/file?key=${key}`;
      
      await db.update(users)
        .set({ image: newUrl })
        .where({ id: user.id } as any);
        
      console.log(`Updated user ${user.id} -> ${newUrl}`);
    }
  }
}

run().catch(console.error).finally(() => process.exit(0));
