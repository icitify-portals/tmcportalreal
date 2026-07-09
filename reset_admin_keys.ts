import { db } from "./lib/db";
import { users } from "./lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
    const email = "admin@tmc.org";
    console.log(`Resetting keys for ${email}...`);
    
    await db.update(users).set({
        publicKey: null,
        encryptedPrivateKey: null,
        salt: null,
        encryptedPrivateKeyRecovery: null,
        recoveryKeyHash: null
    }).where(eq(users.email, email));
    
    console.log("Keys reset successfully.");
    process.exit(0);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
