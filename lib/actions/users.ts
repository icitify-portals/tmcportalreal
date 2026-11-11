'use server'

import { db } from "@/lib/db"
import { users, members } from "@/lib/db/schema"
import { eq, like, or, and, ne, sql } from "drizzle-orm"
import { getServerSession } from "@/lib/session"
import { revalidatePath } from "next/cache"
import { createAuditLog } from "@/lib/audit"

export async function searchUsers(query: string) {
    const session = await getServerSession()
    if (!session || !session.user) return []

    if (!query || query.length < 2) return []

    try {
        const results = await db.select({
            id: users.id,
            name: users.name,
            email: users.email,
            image: users.image
        })
        .from(users)
        .where(
            or(
                like(users.name, `%${query}%`),
                like(users.email, `%${query}%`)
            )
        )
        .limit(10)

        return results
    } catch (error) {
        console.error("Search users error:", error)
        return []
    }
}

export async function updateUserProfileImage(imageUrl: string) {
    const session = await getServerSession()
    if (!session || !session.user?.id) {
        return { success: false, error: "Unauthorized" }
    }

    try {
        await db.update(users)
            .set({ image: imageUrl })
            .where(eq(users.id, session.user.id))
        
        return { success: true }
    } catch (error) {
        console.error("Update profile image error:", error)
        return { success: false, error: "Failed to update profile image" }
    }
}

export async function updateMemberDetails(userId: string, data: {
    name?: string,
    email?: string,
    phone?: string,
    memberId?: string,
    occupation?: string,
    address?: string,
    gender?: 'MALE' | 'FEMALE',
    state?: string,
    lga?: string,
    branch?: string
}) {
    const session = await getServerSession()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }
    
    try {
        // 1. Update User table
        const userUpdates: any = {}
        if (data.name) userUpdates.name = data.name
        if (data.email) userUpdates.email = data.email
        if (data.phone) userUpdates.phone = data.phone
        
        if (Object.keys(userUpdates).length > 0) {
            await db.update(users).set(userUpdates).where(eq(users.id, userId))
        }

        // 2. Update Member table
        const [member] = await db.select().from(members).where(eq(members.userId, userId)).limit(1)
        if (!member) return { success: false, error: "Member record not found" }

        const memberUpdates: any = {}
        if (data.memberId) memberUpdates.memberId = data.memberId
        if (data.occupation) memberUpdates.occupation = data.occupation
        if (data.address) memberUpdates.address = data.address
        if (data.gender) memberUpdates.gender = data.gender

        const currentMetadata = (member.metadata as any) || {}
        memberUpdates.metadata = {
            ...currentMetadata,
            state: data.state || currentMetadata.state,
            lga: data.lga || currentMetadata.lga,
            branch: data.branch || currentMetadata.branch
        }

        await db.update(members).set(memberUpdates).where(eq(members.userId, userId))

        revalidatePath(`/dashboard/admin/users/${userId}`)
        revalidatePath(`/dashboard/admin/users`)
        
        return { success: true }
    } catch (error: any) {
        console.error("Update member error:", error)
        return { success: false, error: error.message || "Failed to update member" }
    }
}

export async function updateUserRecord(userId: string, data: {
    name?: string,
    email?: string,
    phone?: string,
    address?: string,
    isEmailVerified?: boolean,
}) {
    const session = await getServerSession()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    const isSuperAdmin = session.user.isSuperAdmin || false
    const hasPerm = isSuperAdmin || 
                    session.user.permissions?.includes("users:update") || 
                    session.user.roles?.some((r: any) => ["SUPER_ADMIN", "NATIONAL_ADMIN", "STATE_ADMIN"].includes(r.code))

    if (!hasPerm) {
        return { success: false, error: "Forbidden: You do not have permission to update user records" }
    }

    try {
        const [currentUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
        if (!currentUser) return { success: false, error: "User not found" }

        const userUpdates: any = {}

        if (data.name !== undefined) {
            const cleanName = data.name.trim()
            if (cleanName.length < 2) {
                return { success: false, error: "Name must be at least 2 characters long" }
            }
            userUpdates.name = cleanName
        }

        if (data.email !== undefined) {
            const cleanEmail = data.email.trim().toLowerCase()
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(cleanEmail)) {
                return { success: false, error: "Invalid email address format" }
            }

            // Check if email is already taken by another user
            const [existing] = await db.select({ id: users.id })
                .from(users)
                .where(and(
                    eq(sql`LOWER(${users.email})`, cleanEmail),
                    ne(users.id, userId)
                ))
                .limit(1)

            if (existing) {
                return { success: false, error: "This email address is already assigned to another user" }
            }

            userUpdates.email = cleanEmail
        }

        if (data.phone !== undefined) {
            userUpdates.phone = data.phone?.trim() || null
        }

        if (data.address !== undefined) {
            userUpdates.address = data.address?.trim() || null
        }

        if (data.isEmailVerified !== undefined) {
            userUpdates.emailVerified = data.isEmailVerified ? (currentUser.emailVerified || new Date()) : null
        }

        userUpdates.updatedAt = new Date()

        if (Object.keys(userUpdates).length > 0) {
            await db.update(users).set(userUpdates).where(eq(users.id, userId))
        }

        // If member profile exists, sync member metadata (fullName, phone, address)
        const [member] = await db.select().from(members).where(eq(members.userId, userId)).limit(1)
        if (member) {
            const currentMetadata = (member.metadata as any) || {}
            const updatedMetadata = { ...currentMetadata }
            let metadataChanged = false

            if (userUpdates.name) {
                updatedMetadata.fullName = userUpdates.name
                metadataChanged = true
            }
            if (data.phone !== undefined) {
                updatedMetadata.phone = data.phone?.trim() || ""
                metadataChanged = true
            }

            const memberUpdates: any = {}
            if (metadataChanged) memberUpdates.metadata = updatedMetadata
            if (data.address !== undefined) memberUpdates.address = data.address?.trim() || null

            if (Object.keys(memberUpdates).length > 0) {
                await db.update(members).set(memberUpdates).where(eq(members.userId, userId))
            }
        }

        await createAuditLog({
            userId: session.user.id,
            action: "USER_UPDATE",
            entityType: "User",
            entityId: userId,
            description: `Admin updated user record for ${userUpdates.name || currentUser.name} (${userUpdates.email || currentUser.email})`,
            metadata: {
                targetUserId: userId,
                changedFields: Object.keys(userUpdates),
                updatedBy: session.user.email,
            }
        })

        revalidatePath(`/dashboard/admin/users/${userId}`)
        revalidatePath(`/dashboard/admin/users`)

        return { success: true }
    } catch (error: any) {
        console.error("Update user record error:", error)
        return { success: false, error: error.message || "Failed to update user record" }
    }
}
