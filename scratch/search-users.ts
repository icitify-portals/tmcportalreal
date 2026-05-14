
import { db } from "../lib/db";
import { users } from "../lib/db/schema";
import { sql, or, like } from "drizzle-orm";

async function main() {
    const names = [
        "Animashaun Mukaila",
        "ADESINA TAIWO ADEDIRAN",
        "Ogunbajo AbdulHakeem Babatunde",
        "AGBOOLA RASAK TUNDE",
        "Olawunmi Abdulaziz Abiodun",
        "Ibrahim Sherifdeen"
    ];

    console.log('--- Searching for missing users ---');
    for (const name of names) {
        const found = await db.select().from(users).where(sql`LOWER(${users.name}) LIKE LOWER(${'%' + name + '%'})`);
        if (found.length > 0) {
            console.log(`Found ${name}:`, found.map(u => u.name + ' (' + u.id + ')'));
        } else {
            console.log(`Not found: ${name}`);
        }
    }
}

main().catch(console.error);
