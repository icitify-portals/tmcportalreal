import { db } from "@/lib/db";
import { members, jurisdictionCodes, memberIdSequences, organizations } from "@/lib/db/schema";
import { eq, and, or, like, sql, desc } from "drizzle-orm";
import { getStateCode, getCountryCode } from "@/lib/id-config";

/**
 * Generates and assigns a Membership ID for a given member.
 * Format: TMC/{CountryCode}/{StateCode}/{Serial}
 * e.g., TMC/01/05/0001 (Kwara State is 05)
 * 
 * @param memberIdStr The UUID of the member to approve
 */
export async function generateMembershipId(memberIdStr: string) {
    const member = await db.query.members.findFirst({
        where: eq(members.id, memberIdStr),
    });

    if (!member) throw new Error("Member not found");
    if (member.memberId && member.memberId.startsWith("TMC/")) {
        throw new Error("Member already has a valid ID");
    }

    const metadata = (member.metadata || {}) as any;
    let countryName = metadata?.country || "Nigeria";
    if (countryName === "NG") {
        countryName = "Nigeria";
    }

    // Resolve state name: first check metadata, then resolve via organization hierarchy
    let stateName = (metadata?.state || "").trim();

    if (!stateName && member.organizationId) {
        const [org] = await db
            .select()
            .from(organizations)
            .where(eq(organizations.id, member.organizationId))
            .limit(1);

        if (org) {
            if (org.level === "STATE") {
                stateName = org.name;
            } else if (org.state) {
                stateName = org.state;
            } else if (org.parentId) {
                const [parentOrg] = await db
                    .select()
                    .from(organizations)
                    .where(eq(organizations.id, org.parentId))
                    .limit(1);

                if (parentOrg) {
                    if (parentOrg.level === "STATE") {
                        stateName = parentOrg.name;
                    } else if (parentOrg.state) {
                        stateName = parentOrg.state;
                    } else if (parentOrg.parentId) {
                        const [grandParentOrg] = await db
                            .select()
                            .from(organizations)
                            .where(eq(organizations.id, parentOrg.parentId))
                            .limit(1);

                        if (grandParentOrg?.level === "STATE") {
                            stateName = grandParentOrg.name;
                        } else if (grandParentOrg?.state) {
                            stateName = grandParentOrg.state;
                        }
                    }
                }
            }
        }
    }

    // Default fallback if still unresolved
    if (!stateName) {
        stateName = "Kwara"; // Prioritize gracefully if missing
    }

    // Normalize state name (e.g. "Kwara State" -> "Kwara")
    stateName = stateName.replace(/\s+State$/i, "").trim();

    // 1. Get Country Code
    let countryCode = getCountryCode(countryName);
    let countryRow = await db.query.jurisdictionCodes.findFirst({
        where: and(
            eq(jurisdictionCodes.type, "COUNTRY"),
            eq(jurisdictionCodes.name, countryName)
        ),
    });
    if (countryRow?.code) {
        countryCode = countryRow.code;
    }

    // 2. Get State Code
    let stateCode = getStateCode(stateName);
    if (countryRow?.id) {
        const stateRow = await db.query.jurisdictionCodes.findFirst({
            where: and(
                eq(jurisdictionCodes.type, "STATE"),
                eq(jurisdictionCodes.parentId, countryRow.id),
                or(
                    eq(jurisdictionCodes.name, stateName),
                    like(jurisdictionCodes.name, `%${stateName}%`)
                )
            ),
        });
        if (stateRow?.code) {
            stateCode = stateRow.code;
        }
    }

    if (!stateCode || stateCode === "99") {
        stateCode = getStateCode(stateName);
    }
    if (!stateCode || stateCode === "99") {
        stateCode = "05"; // Kwara fallback
    }

    // 3. Construct Sequence Key
    const sequenceKey = `${countryCode}-${stateCode}`;

    let serialFormatted = "0001";
    try {
        // 4. Atomic Increment using UPSERT
        await db
            .insert(memberIdSequences)
            .values({ key: sequenceKey, lastSerial: 1 })
            .onDuplicateKeyUpdate({ set: { lastSerial: sql`lastSerial + 1` } });

        // 5. Fetch the new serial
        const sequence = await db.query.memberIdSequences.findFirst({
            where: eq(memberIdSequences.key, sequenceKey),
        });

        if (sequence) {
            serialFormatted = sequence.lastSerial.toString().padStart(4, "0");
        }
    } catch {
        // Fallback: check highest serial from existing members
        const prefixLike = `TMC/${countryCode}/${stateCode}/%`;
        const lastMember = await db.query.members.findFirst({
            where: like(members.memberId, prefixLike),
            orderBy: [desc(members.memberId)],
        });

        let nextSerial = 1;
        if (lastMember?.memberId) {
            const parts = lastMember.memberId.split("/");
            const lastPart = parseInt(parts[parts.length - 1], 10);
            if (!isNaN(lastPart)) {
                nextSerial = lastPart + 1;
            }
        }
        serialFormatted = nextSerial.toString().padStart(4, "0");
    }

    // 6. Format ID: TMC/01/05/####
    const prefix = "TMC";
    const newMemberId = `${prefix}/${countryCode}/${stateCode}/${serialFormatted}`;

    // 7. Update Member
    await db
        .update(members)
        .set({
            memberId: newMemberId,
            status: "ACTIVE",
            approvedAt: new Date(),
        })
        .where(eq(members.id, memberIdStr));

    return newMemberId;
}
