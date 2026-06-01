import { db } from "../lib/db";
import { users, officials, organizations, offices, programmes } from "../lib/db/schema";
import { eq, like } from "drizzle-orm";
import { createProgramme } from "../lib/actions/programmes";

// Mock getServerSession
jest.mock("next-auth", () => ({
    getServerSession: jest.fn()
}));

async function main() {
    const userRes = await db.select().from(users).where(like(users.name, '%oladunjoye%')).limit(1);
    const user = userRes[0];
    const officialRes = await db.select().from(officials).where(eq(officials.userId, user.id));
    const official = officialRes[0];

    const mockSession = {
        user: {
            id: user.id,
            officialId: official.id,
            officialOrganizationId: official.organizationId,
            officialLevel: official.positionLevel,
            isSuperAdmin: false
        }
    };
    
    // We can't mock getServerSession easily in a tsx script running without jest.
    // Instead, let's just inspect the logic.
}
