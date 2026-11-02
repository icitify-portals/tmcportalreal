import { db } from "@/lib/db";
import { officials, offices } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { canManagePostsFromSession, isNaipaMatcher } from "./posts-auth";

export { canManagePostsFromSession, isNaipaMatcher };

/**
 * Server-side authorization check with database fallback for existing sessions.
 */
export async function canUserManagePosts(session: any): Promise<boolean> {
    if (!session?.user?.id) return false;
    if (canManagePostsFromSession(session.user)) return true;

    try {
        const [row] = await db
            .select({
                officialLevel: officials.positionLevel,
                officeName: offices.name,
            })
            .from(officials)
            .leftJoin(offices, eq(officials.officeId, offices.id))
            .where(eq(officials.userId, session.user.id))
            .limit(1);

        if (row && row.officialLevel === "NATIONAL") {
            if (isNaipaMatcher(row.officeName)) {
                return true;
            }
        }
    } catch (err) {
        console.error("canUserManagePosts check failed:", err);
    }

    return false;
}
