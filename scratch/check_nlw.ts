import { db } from "./lib/db";
import { programmeRegistrations, programmes } from "./lib/db/schema";
import { eq, like } from "drizzle-orm";

async function check() {
    const progs = await db.select().from(programmes).where(like(programmes.title, "%NATIONAL LEADERSHIP WORKSHOP%"));
    console.log("Found Programmes:", progs.map(p => ({ id: p.id, title: p.title })));
    
    for (const p of progs) {
        const regs = await db.select().from(programmeRegistrations).where(eq(programmeRegistrations.programmeId, p.id));
        console.log(`Registrations for ${p.title} (${p.id}):`, regs.length);
    }
    process.exit(0);
}

check();
