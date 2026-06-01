import { db } from "../lib/db";
import { users, officials, organizations, offices, userRoles, roles } from "../lib/db/schema";
import { eq, like } from "drizzle-orm";

async function main() {
    const userRes = await db.select().from(users).where(like(users.name, '%oladunjoye%')).limit(1);
    if (!userRes.length) {
        console.log("User not found");
        process.exit(1);
    }
    const user = userRes[0];
    console.log("User:", user);

    const officialRes = await db.select().from(officials).where(eq(officials.userId, user.id));
    console.log("Official Records:", officialRes);

    for (const official of officialRes) {
        const orgRes = await db.select().from(organizations).where(eq(organizations.id, official.organizationId));
        console.log(`Org for Official ${official.id}:`, orgRes[0]);

        if (official.officeId) {
            const officeRes = await db.select().from(offices).where(eq(offices.id, official.officeId));
            console.log(`Office for Official ${official.id}:`, officeRes[0]);
        }
    }
    const rolesRes = await db.select({
        roleCode: roles.code,
        organizationId: userRoles.organizationId
    })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, user.id));
    
    console.log("User Roles:", rolesRes);

    const { members } = require("../lib/db/schema");
    const memberRes = await db.select().from(members).where(eq(members.userId, user.id));
    console.log("Member Records:", memberRes);

    const { offices } = require("../lib/db/schema");
    const officeRes = await db.select().from(offices).where(eq(offices.organizationId, 'c02137d0-c3c1-445d-9d1a-92c7be200332'));
    console.log("National Offices:", officeRes);

    process.exit(0);
}

main().catch(console.error);
