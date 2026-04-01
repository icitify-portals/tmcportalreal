'use server'

import { db } from "@/lib/db"
import { broadcasts, organizations, users, officials, members } from "@/lib/db/schema"
import { eq, and, desc, sql, inArray, or, isNull } from "drizzle-orm"
import { getServerSession } from "@/lib/session"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const broadcastSchema = z.object({
    title: z.string().min(1, "Title is required"),
    content: z.string().min(1, "Content is required"),
    targetType: z.enum(['ALL', 'OFFICIALS_ONLY', 'INDIVIDUALS', 'JURISDICTION_MEMBERS']),
    targetLevel: z.enum(['NATIONAL', 'STATE', 'LOCAL_GOVERNMENT', 'BRANCH']).nullable().optional(),
    targetOfficialLevel: z.enum(['NATIONAL', 'STATE', 'LOCAL_GOVERNMENT', 'BRANCH']).nullable().optional(),
    targetId: z.string().nullable(),
    recipientIds: z.array(z.string()).optional(), // For INDIVIDUALS
    media: z.array(z.object({
        type: z.enum(['image', 'audio', 'video']),
        url: z.string()
    })).optional()
})

export async function sendBroadcast(payload: any) {
    const session = await getServerSession()
    if (!session || !session.user) return { success: false, error: "Unauthorized" }

    try {
        const validated = broadcastSchema.parse(payload)

        const officialRows = await db.select().from(officials)
            .leftJoin(organizations, eq(officials.organizationId, organizations.id))
            .where(eq(officials.userId, session.user.id))
            .limit(1)

        const official = officialRows[0] ? { ...officialRows[0].officials, organization: officialRows[0].organizations } : null
        const isSuperAdmin = session.user.isSuperAdmin

        if (!official && !isSuperAdmin) {
            return { success: false, error: "Only officials or superadmins can send broadcasts" }
        }

        const userOrg = official?.organization

        // Insert broadcast
        const broadcastId = crypto.randomUUID()
        await db.insert(broadcasts).values({
            id: broadcastId,
            senderId: session.user.id,
            title: validated.title,
            content: validated.content,
            targetType: validated.targetType,
            targetLevel: validated.targetLevel || (userOrg?.level ?? 'NATIONAL'),
            targetOfficialLevel: validated.targetOfficialLevel || null,
            targetId: validated.targetId || (userOrg?.id ?? null),
            media: validated.media || []
        })

        // If targetType is INDIVIDUALS, add recipients
        if (validated.targetType === 'INDIVIDUALS' && validated.recipientIds && validated.recipientIds.length > 0) {
            const recipientValues = validated.recipientIds.map(userId => ({
                broadcastId,
                userId
            }))
            // @ts-ignore
            await db.insert(broadcastRecipients).values(recipientValues)
        }

        revalidatePath("/dashboard/broadcasts")
        return { success: true }
    } catch (error: any) {
        console.error("Failed to send broadcast:", error)
        return { success: false, error: error.message || "Failed to send broadcast" }
    }
}

export async function getBroadcasts() {
    const session = await getServerSession()
    if (!session || !session.user) return []

    try {
        // 1. Get user's org info
        const memberRows = await db.select().from(members)
            .leftJoin(organizations, eq(members.organizationId, organizations.id))
            .where(eq(members.userId, session.user.id))
            .limit(1)
        const memberProfile = memberRows[0] ? { ...memberRows[0].members, organization: memberRows[0].organizations } : null

        const officialRows = await db.select().from(officials)
            .leftJoin(organizations, eq(officials.organizationId, organizations.id))
            .where(eq(officials.userId, session.user.id))
            .limit(1)
        const officialProfile = officialRows[0] ? { ...officialRows[0].officials, organization: officialRows[0].organizations } : null

        const organization = memberProfile?.organization || officialProfile?.organization
        const isOfficial = !!officialProfile
        const officialLevel = officialProfile?.positionLevel

        // 2. Fetch ancestors if in an org
        const ancestors: string[] = []
        if (organization) {
            ancestors.push(organization.id)
            let currParentId = organization.parentId
            while (currParentId) {
                ancestors.push(currParentId)
                const parent = await db.select({ parentId: organizations.parentId }).from(organizations).where(eq(organizations.id, currParentId)).limit(1)
                currParentId = parent[0]?.parentId ?? null
            }
        }

        // 3. Main Query
        const broadcastRows = await db.select({
            broadcasts: broadcasts,
            senderName: users.name,
            senderImage: users.image,
            targetOrganization: organizations
        })
            .from(broadcasts)
            .leftJoin(users, eq(broadcasts.senderId, users.id))
            .leftJoin(organizations, eq(broadcasts.targetId, organizations.id))
            .leftJoin(broadcastRecipients, and(eq(broadcastRecipients.broadcastId, broadcasts.id), eq(broadcastRecipients.userId, session.user.id)))
            .where(or(
                eq(broadcasts.targetType, 'ALL'),
                // Individual target
                and(eq(broadcasts.targetType, 'INDIVIDUALS'), sql`${broadcastRecipients.userId} IS NOT NULL`),
                // Jurisdiction members
                and(
                    eq(broadcasts.targetType, 'JURISDICTION_MEMBERS'),
                    ancestors.length > 0 ? inArray(broadcasts.targetId, ancestors) : eq(broadcasts.targetLevel, 'NATIONAL')
                ),
                // Officials only
                and(
                    eq(broadcasts.targetType, 'OFFICIALS_ONLY'),
                    isOfficial ? (
                        broadcasts.targetOfficialLevel ? eq(broadcasts.targetOfficialLevel, officialLevel as any) : sql`1=1`
                    ) : sql`1=0`,
                    ancestors.length > 0 ? inArray(broadcasts.targetId, ancestors) : sql`1=1`
                )
            ))
            .orderBy(desc(broadcasts.createdAt))

        return broadcastRows.map(row => ({
            ...row.broadcasts,
            sender: { name: row.senderName, image: row.senderImage },
            targetOrganization: row.targetOrganization
        }))
    } catch (error) {
        console.error("Error fetching broadcasts:", error)
        return []
    }
}

export async function deleteBroadcast(id: string) {
    const session = await getServerSession()
    if (!session || !session.user) return { success: false, error: "Unauthorized" }

    try {
        // Check if sender
        await db.delete(broadcasts).where(and(eq(broadcasts.id, id), eq(broadcasts.senderId, session.user.id)))
        revalidatePath("/dashboard/broadcasts")
        return { success: true }
    } catch (error) {
        return { success: false, error: "Failed to delete" }
    }
}
