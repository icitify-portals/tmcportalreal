import { db } from "../lib/db";
import { programmeRegistrations, members, users, programmes } from "../lib/db/schema";
import { eq, and } from "drizzle-orm";

async function fixUserRegistration() {
    const email = "oliyide007@gmail.com";
    console.log(`Fixing registration for ${email}...`);

    // 1. Find the user and member
    const user = await db.query.users.findFirst({
        where: eq(users.email, email)
    });

    if (!user) {
        console.error("User not found!");
        return;
    }

    const member = await db.query.members.findFirst({
        where: eq(members.userId, user.id)
    });

    // 2. Find the most recent programme (likely the one they were in)
    const latestProgramme = await db.query.programmes.findFirst({
        orderBy: (programmes, { desc }) => [desc(programmes.createdAt)]
    });

    if (!latestProgramme) {
        console.error("No programmes found!");
        return;
    }

    console.log(`Registering for programme: ${latestProgramme.title}`);

    // 3. Check if already registered
    const existing = await db.query.programmeRegistrations.findFirst({
        where: and(
            eq(programmeRegistrations.programmeId, latestProgramme.id),
            eq(programmeRegistrations.email, email)
        )
    });

    if (existing) {
        console.log("Registration already exists, updating to PAID...");
        await db.update(programmeRegistrations)
            .set({ 
                status: 'PAID',
                userId: user.id,
                amountPaid: latestProgramme.amount?.toString() || "0"
            })
            .where(eq(programmeRegistrations.id, existing.id));
    } else {
        console.log("Creating new registration as PAID...");
        await db.insert(programmeRegistrations).values({
            id: crypto.randomUUID(),
            programmeId: latestProgramme.id,
            userId: user.id,
            name: user.name || "Unknown",
            email: email,
            phone: user.phone || "",
            status: 'PAID',
            amountPaid: latestProgramme.amount?.toString() || "0",
            paymentMethod: 'MANUAL',
            paymentRef: 'MANUAL_RESTORE',
        });
    }

    console.log("Success!");
}

fixUserRegistration().catch(console.error);
