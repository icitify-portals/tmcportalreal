import { db } from "@/lib/db";
import { members } from "@/lib/db/schema";
import { like, desc } from "drizzle-orm";
import { getCountryCode, getStateCode } from "@/lib/id-config";

/**
 * Generates a new unique Membership ID
 * Format: TMC/CC/SS/####
 * @param country Country Name
 * @param state State Name
 */
export async function generateMembershipId(country: string, state: string): Promise<string> {
    const cc = getCountryCode(country);
    const ss = getStateCode(state);
    const prefix = `TMC/${cc}/${ss}/`;

    // Find the last ID with this prefix
    // Using 'like' manually constructed. Drizzle 'like' operator pattern:
    const lastMember = await db.query.members.findFirst({
        where: like(members.memberId, `${prefix}%`),
        orderBy: [desc(members.memberId)],
    });

    let nextSerial = 1;

    if (lastMember && lastMember.memberId) {
        const parts = lastMember.memberId.split("/");
        const lastSerialStr = parts[parts.length - 1];
        const lastSerial = parseInt(lastSerialStr, 10);
        if (!isNaN(lastSerial)) {
            nextSerial = lastSerial + 1;
        }
    }

    // Pad to 4 digits
    const serialStr = nextSerial.toString().padStart(4, "0");

    return `${prefix}${serialStr}`;
}
