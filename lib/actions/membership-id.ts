
import { db } from "@/lib/db"
import { members, jurisdictionCodes, memberIdSequences } from "@/lib/db/schema"
import { eq, and, sql } from "drizzle-orm"

/**
 * Generates and assigns a Membership ID for a given member.
 * Format: TMC/{CountryCode}/{StateCode}/{Serial}
 * e.g., TMC/01/01/0001
 * 
 * @param memberIdStr The UUID of the member to approve
 */
export async function generateMembershipId(memberIdStr: string) {
    const member = await db.query.members.findFirst({
        where: eq(members.id, memberIdStr),
    })

    if (!member) throw new Error("Member not found")
    if (member.memberId && member.memberId.startsWith("TMC/")) {
        throw new Error("Member already has a valid ID")
    }

    // Extract Location Data from Metadata (or direct fields if we mapped them)
    // We rely on metadata.country and metadata.state
    const metadata = member.metadata as any
    let countryName = metadata?.country || "Nigeria" // Default to Nigeria if missing?

    // Normalize NG to Nigeria
    if (countryName === "NG") {
        countryName = "Nigeria"
    }

    const stateName = metadata?.state

    if (!stateName) throw new Error("Member state is missing")

    // 1. Get Country Code
    const country = await db.query.jurisdictionCodes.findFirst({
        where: and(
            eq(jurisdictionCodes.type, "COUNTRY"),
            eq(jurisdictionCodes.name, countryName)
        )
    })

    if (!country) throw new Error(`Jurisdiction code for country '${countryName}' not found. Please contact admin.`)

    // 2. Get State Code
    const state = await db.query.jurisdictionCodes.findFirst({
        where: and(
            eq(jurisdictionCodes.type, "STATE"),
            eq(jurisdictionCodes.parentId, country.id),
            eq(jurisdictionCodes.name, stateName)
        )
    })

    if (!state) throw new Error(`Jurisdiction code for state '${stateName}' not found. Please contact admin.`)

    // 3. Construct Sequence Key
    const sequenceKey = `${country.code}-${state.code}`

    // 4. Atomic Increment using UPSERT
    // If not exists, insert 1. If exists, increment.
    // For MySQL: INSERT ... ON DUPLICATE KEY UPDATE lastSerial = lastSerial + 1
    await db.insert(memberIdSequences)
        .values({ key: sequenceKey, lastSerial: 1 })
        .onDuplicateKeyUpdate({ set: { lastSerial: sql`lastSerial + 1` } })

    // 5. Fetch the new serial
    const sequence = await db.query.memberIdSequences.findFirst({
        where: eq(memberIdSequences.key, sequenceKey)
    })

    if (!sequence) throw new Error("Failed to generate sequence")

    const serialRaw = sequence.lastSerial
    const serialFormatted = serialRaw.toString().padStart(4, '0')

    // 6. Format ID
    const prefix = "TMC"

    // ID Format: TM/CC/SS/#### or TMC/CC/SS/####
    const newMemberId = `${prefix}/${country.code}/${state.code}/${serialFormatted}`

    // 7. Update Member
    // Note: We only set ID and ApprovedAt. Status change might happen in the calling function or here.
    // The user requirement says "approve the application... at point of approval... ID is generated".
    // So logic implies this function is part of approval.
    await db.update(members)
        .set({
            memberId: newMemberId,
            status: "ACTIVE",
            approvedAt: new Date(),
        })
        .where(eq(members.id, memberIdStr))

    return newMemberId
}
