
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function main() {
    const args = process.argv.slice(2);
    const email = args[0];
    const newPassword = args[1];

    if (!email || !newPassword) {
        console.log("Usage: npx tsx scripts/reset-password.ts <email> <new_password>");
        process.exit(1);
    }

    console.log(`Resetting password for: ${email}`);

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Check if user exists
    const user = await db.query.users.findFirst({
        where: eq(users.email, email)
    });

    if (!user) {
        console.error(`❌ User ${email} not found!`);
        process.exit(1);
    }

    await db.update(users)
        .set({ password: hashedPassword })
        .where(eq(users.email, email));

    console.log(`✅ Password updated successfully for ${email}`);
    console.log(`New Hash: ${hashedPassword}`);
}

main().catch(console.error);
