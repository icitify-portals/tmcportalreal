'use server'

import { db } from "@/lib/db"
import { users, members } from "@/lib/db/schema"
import { eq, like, or } from "drizzle-orm"
import { getServerSession } from "@/lib/session"
import { revalidatePath } from "next/cache"

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
