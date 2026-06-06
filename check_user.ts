import { db } from './lib/db';
import { users } from './lib/db/schema';
import { eq } from 'drizzle-orm';

async function run() {
    try {
        const email = 'biodunadebayo1@gmail.com';
        const [user] = await db.select().from(users).where(eq(users.email, email));
        console.log('User emailVerified:', user?.emailVerified);
        console.log('Type of emailVerified:', typeof user?.emailVerified);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}
run();
