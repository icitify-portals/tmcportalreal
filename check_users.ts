import { db } from "./lib/db";
import { users } from "./lib/db/schema";
import { count } from "drizzle-orm";

async function main() {
    try {
        const [result] = await db.select({ value: count() }).from(users);
        console.log(`Total users: ${result.value}`);

        if (result.value > 0) {
            const allUsers = await db.select({
                email: users.email,
                emailVerified: users.emailVerified,
                name: users.name
            }).from(users).limit(10);

            console.log("Users (first 10):");
            console.table(allUsers);
        }
    } catch (error) {
        console.error("Error checking users:", error);
    } finally {
        process.exit(0);
    }
}

main();
