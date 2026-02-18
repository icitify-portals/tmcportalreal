
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function main() {
    const args = process.argv.slice(2);
    const email = args[0];
    const password = args[1];

    if (!email) {
        console.log("No email provided. Listing last 5 users...");
        const lastUsers = await db.select().from(users).limit(5);
        console.table(lastUsers.map(u => ({
            id: u.id,
            email: u.email,
            name: u.name,
            emailVerified: u.emailVerified,
            hasPassword: !!u.password
        })));
        console.log("\nUsage: npx tsx scripts/debug-auth.ts <email> <password>");
        process.exit(0);
    }

    console.log(`\nChecking user: ${email}...`);
    const user = await db.query.users.findFirst({
        where: eq(users.email, email)
    });

    if (!user) {
        console.error("❌ User not found!");
        process.exit(1);
    }

    console.log("✅ User found:", {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        hasPassword: !!user.password
    });

    if (!user.password) {
        console.error("❌ User has no password set (OAuth account?)");
        process.exit(1);
    }

    if (!password) {
        console.log("No password provided for verification. Exiting.");
        process.exit(0);
    }

    console.log(`\nVerifying password: '${password}'...`);
    const isValid = await bcrypt.compare(password, user.password);

    if (isValid) {
        console.log("✅ Password is CORRECT!");
        // Generate a new hash to see if it matches logic
        const newHash = await bcrypt.hash(password, 10);
        console.log(`Test Hash (for reference): ${newHash}`);
    } else {
        console.error("❌ Password is INCORRECT.");
        console.log(`Stored Hash: ${user.password}`);
    }
}

main().catch(console.error);
