import { db } from './lib/db';
import { users } from './lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function run() {
    try {
        const email = 'biodunadebayo1@gmail.com';
        const newPassword = '*abdulHAmeed@14';
        
        const [user] = await db.select().from(users).where(eq(users.email, email));
        if (!user) {
            console.log('User not found in the database');
            process.exit(1);
        }
        
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        await db.update(users).set({
            password: hashedPassword,
            emailVerified: user.emailVerified ? user.emailVerified : new Date()
        }).where(eq(users.id, user.id));
        
        console.log(`Successfully updated password for ${email}. Email verified status: ${user.emailVerified ? 'Already verified' : 'Verified just now'}.`);
        process.exit(0);
    } catch (error) {
        console.error('Error updating user:', error);
        process.exit(1);
    }
}

run();
