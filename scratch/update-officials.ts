
import { db } from "../lib/db";
import { users, officials, organizations } from "../lib/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

async function main() {
    const [nationalOrg] = await db.select().from(organizations).where(eq(organizations.level, 'NATIONAL')).limit(1);
    const natId = nationalOrg.id;

    const data = [
        { name: "Animashaun Mukaila", pos: "Naibul Amir Administration" },
        { name: "KAREEM ABDULLAHI OLAWALE", pos: "Assistance Secretary General" },
        { name: "ADESINA TAIWO ADEDIRAN", pos: "SECRETARY GENERAL" },
        { name: "GBADEBO ADEROGBA ABIOLA", pos: "EXECUTIVE DIRECTOR, CENTRE FOR GLOBAL PEACE INITIATIVE (CGPI)" },
        { name: "Oladunjoye Kamorudeen Bolaji", pos: "NAIBUL AMIR, INFORMATION AND PUBLICATION AFFAIRS (NAIPA)" },
        { name: "Ogunbajo AbdulHakeem Babatunde", pos: "National Asset Maintenance Officer (NAMO)" },
        { name: "AGBOOLA RASAK TUNDE", pos: "President, The Congress Investment Club (TCIC)" },
        { name: "Olawunmi Abdulaziz Abiodun", pos: "Chairman, The Congress Professionals (TCP)" },
        { name: "ADEYEMI ISHAQ ADEKUNLE", pos: "National Financial Secretary (NAFINS)" },
        { name: "Ibrahim Sherifdeen", pos: "Naibul Amir, Da'wah Affairs (NADA)" },
        { name: "Salahudeen Qamarudeen Aremu", pos: "Head, Drama and Entertainment (HD&E)" },
        { name: "AYENI ADESINA SULAIMAN", pos: "Manager, IMC and Estate" }
    ];

    for (const item of data) {
        // Try to find user by name (flexible search for extra spaces)
        const userQuery = await db.select().from(users).where(sql`REPLACE(${users.name}, '  ', ' ') LIKE REPLACE(${item.name}, '  ', ' ')`);
        let user = userQuery[0];

        if (!user) {
            // Try searching by parts
            const parts = item.name.split(' ');
            const query = await db.select().from(users).where(and(
                ...parts.map(p => sql`LOWER(${users.name}) LIKE LOWER(${'%' + p + '%'})`)
            ));
            user = query[0];
        }

        if (user) {
            console.log(`Processing: ${user.name} -> ${item.pos}`);
            const existing = await db.select().from(officials).where(eq(officials.userId, user.id)).limit(1);
            if (existing.length > 0) {
                await db.update(officials).set({
                    organizationId: natId,
                    position: item.pos,
                    positionLevel: 'NATIONAL'
                }).where(eq(officials.id, existing[0].id));
                console.log(`  Updated existing official record.`);
            } else {
                await db.insert(officials).values({
                    userId: user.id,
                    organizationId: natId,
                    position: item.pos,
                    positionLevel: 'NATIONAL',
                    termStart: new Date(),
                    isActive: true
                });
                console.log(`  Created new official record.`);
            }
        } else {
            console.log(`!!! USER NOT FOUND: ${item.name}`);
        }
    }
}

main().catch(console.error);
