"use server"

import { db } from "@/lib/db"
import { offices } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { getServerSession } from "@/lib/session"

export async function updateOfficeCategories(officeId: string, categories: string[]) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        await db.update(offices)
            .set({ managedSpecialCategories: categories })
            .where(eq(offices.id, officeId))

        revalidatePath("/dashboard/admin/settings/offices")
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to update office" }
    }
}
