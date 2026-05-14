
import { db } from "../lib/db";
import { users, officials, organizations, offices } from "../lib/db/schema";
import { eq, sql } from "drizzle-orm";

async function main() {
    const nationalOrg = await db.select().from(organizations).where(eq(organizations.level, 'NATIONAL')).limit(1);
    const natId = nationalOrg[0]?.id;
    console.log('National Org:', nationalOrg[0]?.name, natId);

    const targetOfficials = [
        { name: "Animashaun Mukaila", position: "Naibul Amir Administration" },
        { name: "KAREEM ABDULLAHI OLAWALE", position: "Assistance Secretary General" },
        { name: "ADESINA TAIWO ADEDIRAN", position: "SECRETARY GENERAL" },
        { name: "GBADEBO ADEROGBA ABIOLA", position: "EXECUTIVE DIRECTOR, CENTRE FOR GLOBAL PEACE INITIATIVE (CGPI)" },
        { name: "Oladunjoye Kamorudeen Bolaji", position: "NAIBUL AMIR, INFORMATION AND PUBLICATION AFFAIRS (NAIPA)" },
        { name: "Ogunbajo AbdulHakeem Babatunde", position: "National Asset Maintenance Officer (NAMO)" },
        { name: "AGBOOLA RASAK TUNDE", position: "President, The Congress Investment Club (TCIC)" },
        { name: "Olawunmi Abdulaziz Abiodun", position: "Chairman, The Congress Professionals (TCP)" },
        { name: "ADEYEMI ISHAQ ADEKUNLE", position: "National Financial Secretary (NAFINS)" },
        { name: "Ibrahim Sherifdeen", position: "Naibul Amir, Da'wah Affairs (NADA)" },
        { name: "Salahudeen Qamarudeen Aremu", position: "Head, Drama and Entertainment (HD&E)" },
        { name: "AYENI ADESINA SULAIMAN", position: "Manager, IMC and Estate" }
    ];

    console.log('--- Auditing Target Officials ---');
    for (const target of targetOfficials) {
        // Search user
        const foundUsers = await db.select().from(users).where(sql`LOWER(${users.name}) LIKE LOWER(${'%' + target.name.split(' ')[0] + '%'})`);
        const exactUser = foundUsers.find(u => u.name.toLowerCase().includes(target.name.toLowerCase().split(' ')[0]));
        
        if (!exactUser) {
            console.log(`[MISSING USER] ${target.name}`);
            continue;
        }

        // Search official record
        const officialRecord = await db.select().from(officials).where(eq(officials.userId, exactUser.id)).limit(1);
        
        if (officialRecord.length > 0) {
            const current = officialRecord[0];
            const currentOrg = (await db.select().from(organizations).where(eq(organizations.id, current.organizationId)).limit(1))[0];
            console.log(`[FOUND] ${exactUser.name} | Current: ${current.position} (${currentOrg?.name}) | Target: ${target.position}`);
            
            // Update if necessary
            if (current.organizationId !== natId || current.position !== target.position) {
                console.log(`  -> NEEDS UPDATE: Move to National and set position to ${target.position}`);
                // await db.update(officials).set({ organizationId: natId, position: target.position }).where(eq(officials.id, current.id));
            }
        } else {
            console.log(`[NO OFFICIAL RECORD] ${exactUser.name} (${exactUser.id}) | Target: ${target.position}`);
            // Create record
            // await db.insert(officials).values({ userId: exactUser.id, organizationId: natId, position: target.position, positionLevel: 'NATIONAL', termStart: new Date() });
        }
    }
}

main().catch(console.error);
