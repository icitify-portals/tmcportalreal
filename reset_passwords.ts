import { db } from "./lib/db";
import { users } from "./lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function main() {
    const hashedPassword = await bcrypt.hash("Admin123@", 10);

    // Reset admin
    await db.update(users)
        .set({ password: hashedPassword })
        .where(eq(users.email, "admin@tmc.org"));
    console.log("Password for admin@tmc.org reset to: Admin123@");

    // Reset aa.adelopo2@gmail.com
    await db.update(users)
        .set({ password: hashedPassword })
        .where(eq(users.email, "aa.adelopo2@gmail.com"));
    console.log("Password for aa.adelopo2@gmail.com reset to: Admin123@");

    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
