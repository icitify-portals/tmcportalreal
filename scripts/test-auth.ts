import { db } from "../lib/db";
import { users, officials, organizations } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import { createProgramme } from "../lib/actions/programmes";

async function main() {
    const userId = "ab16f967-85f4-4f95-89b5-bcd9569c43bc";
    
    const officialProfileData = await db.select({
        id: officials.id,
        organizationId: officials.organizationId,
        positionLevel: officials.positionLevel
    })
    .from(officials)
    .where(eq(officials.userId, userId))
    .limit(1);

    console.log("Official Profile:", officialProfileData);

    const token: any = { id: userId };
    if (officialProfileData.length > 0) {
        token.officialId = officialProfileData[0].id
        token.officialOrganizationId = officialProfileData[0].organizationId
        token.officialLevel = officialProfileData[0].positionLevel
    }

    const sessionUser = {
        id: token.id,
        officialId: token.officialId,
        officialOrganizationId: token.officialOrganizationId,
        officialLevel: token.officialLevel,
        isSuperAdmin: false
    };

    console.log("Session User:", sessionUser);

    const organizationId = sessionUser.officialOrganizationId || "fallback";
    console.log("Organization ID:", organizationId);

    const [org] = await db.select().from(organizations).where(eq(organizations.id, organizationId));
    console.log("Target Org:", org?.level);
    
    // Check permission logic
    const userLevel = sessionUser.officialLevel as string
    const targetLevel = org?.level

    console.log("Checking Permissions:", { userLevel, targetLevel });
    if (userLevel === 'NATIONAL' && targetLevel !== 'NATIONAL') {
        console.log("ERROR: National admins can only create programmes for National level");
    } else {
        console.log("SUCCESS: Permissions checked");
    }

    process.exit(0);
}

main().catch(console.error);
