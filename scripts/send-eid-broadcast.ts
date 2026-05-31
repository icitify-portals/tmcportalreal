import { db } from '../lib/db';
import { users } from '../lib/db/schema';
import crypto from 'crypto';
import { sql } from 'drizzle-orm';

async function run() {
  const someUser = await db.select().from(users).limit(1);
  
  if (someUser.length === 0) {
    console.error("No users found to act as sender.");
    process.exit(1);
  }

  const sender = someUser[0];
  const broadcastId = crypto.randomUUID();

  const title = "Eid-al-Adha Greetings";
  const content = `Assalamu Alaikum wa Rahmatullah wa Barakatuhu,

I extend my warmest greetings to all our dedicated officials on the blessed occasion of Eid al-Adha. May Allah (SWT) accept our sacrifices, bless our efforts in serving the Ummah, and grant us peace, prosperity, and steadfastness on His path. 

Taqabbalallahu Minna wa Minkum.

Warm regards,
Amir, The Muslim Congress (TMC)`;

  const targetId = 'c02137d0-c3c1-445d-9d1a-92c7be200332'; // Root Organization

  await db.execute(sql`
    INSERT INTO broadcasts (id, senderId, title, content, target_type, level, targetId, media) 
    VALUES (${broadcastId}, ${sender.id}, ${title}, ${content}, 'OFFICIALS_ONLY', 'NATIONAL', ${targetId}, '[]')
  `);

  console.log(`Eid Broadcast successfully sent to all officials with root targetId!`);
}

run().catch(console.error).finally(() => process.exit(0));
