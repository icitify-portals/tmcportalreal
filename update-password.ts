import { db } from './lib/db';
import { users } from './lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function main() {
    const email = 'biodunadebayo1@gmail.com';
    const password = 'abdulHAmeed@14';
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        await db.update(users)
            .set({ 
                password: hashedPassword,
                emailVerified: new Date()
            })
            .where(eq(users.email, email));
            
        console.log(`Successfully updated password and verified email for ${email}`);
    } catch (e: any) {
        console.error('Failed to update user:', e.message);
    }
}

main().catch(console.error);
