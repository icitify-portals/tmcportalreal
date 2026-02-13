
"use server"

import { db } from "@/lib/db"
import { navigationItems } from "@/lib/db/schema"
import { eq, asc, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const navItemSchema = z.object({
    label: z.string().min(1, "Label is required"),
    path: z.string().optional().nullable(),
    parentId: z.string().optional().nullable(),
    order: z.number().default(0),
    type: z.enum(["link", "dropdown", "button"]).default("link"),
    isActive: z.boolean().default(true),
    organizationId: z.string().optional(),
})

export type NavigationItem = typeof navigationItems.$inferSelect & {
    children?: NavigationItem[]
}

export type SerializedNavigationItem = Omit<typeof navigationItems.$inferSelect, 'createdAt' | 'updatedAt'> & {
    createdAt: string;
    updatedAt: string;
    children?: SerializedNavigationItem[];
}

export async function getNavigationItems(organizationId?: string, includeInactive = false) {
    try {
        // Fetch ALL items first to debug/ensure we get data. 
        // In a real app we'd filter strictly, but if organizeId is missing in session, we might see nothing.
        // Let's allow fetching global items (organizationId is null) AND specific org items?
        // Or just matching the param.

        const conditions = [
            includeInactive ? undefined : eq(navigationItems.isActive, true)
        ]

        if (organizationId) {
            conditions.push(eq(navigationItems.organizationId, organizationId))
        } else {
            // If no org ID provided, maybe fetch Global/System items (where orgId is null)
            // conditions.push(isNull(navigationItems.organizationId))
        }

        // Use `and` correctly
        const whereClause = and(...conditions.filter(Boolean))

        const allItems = await db.query.navigationItems.findMany({
            where: whereClause,
            orderBy: [asc(navigationItems.order)]
        })

        // Serialize dates to strings for client component
        const serialized = allItems.map(item => {
            const isValidDate = (d: any) => d instanceof Date && !isNaN(d.getTime());
            const fallbackDate = "1970-01-01T00:00:00.000Z";

            return {
                ...item,
                createdAt: isValidDate(item.createdAt) ? item.createdAt!.toISOString() : fallbackDate,
                updatedAt: isValidDate(item.updatedAt) ? item.updatedAt!.toISOString() :
                    (isValidDate(item.createdAt) ? item.createdAt!.toISOString() : fallbackDate),
            };
        })

        // Build Tree structure
        const itemMap = new Map<string, SerializedNavigationItem>();
        serialized.forEach(item => {
            (item as any).children = [];
            itemMap.set(item.id, item as any);
        });

        const nested: SerializedNavigationItem[] = [];
        serialized.forEach(item => {
            if (item.parentId && itemMap.has(item.parentId)) {
                itemMap.get(item.parentId)!.children!.push(item as any);
            } else {
                nested.push(item as any);
            }
        });

        return { success: true, data: nested }
    } catch (error) {
        console.error("Failed to fetch navigation:", error)
        return { success: false, error: "Failed to load menu" }
    }
}

export async function saveNavigationItem(data: z.infer<typeof navItemSchema> & { id?: string }) {
    try {
        const validated = navItemSchema.parse(data)

        if (data.id) {
            await db.update(navigationItems)
                .set({
                    ...validated,
                    updatedAt: new Date()
                })
                .where(eq(navigationItems.id, data.id))
        } else {
            await db.insert(navigationItems).values(validated)
        }

        revalidatePath("/dashboard/admin/cms/menus")
        // Also revalidate public pages if needed
        return { success: true }
    } catch (error) {
        console.error("Failed to save navigation item:", error)
        return { success: false, error: "Failed to save item" }
    }
}

export async function deleteNavigationItem(id: string) {
    try {
        // Validation: Ensure valid ID and maybe permissions check (handled by caller/auth usually)

        // Manual cascade might be needed if DB cascade not set (I set it in schema, but verification is good)
        // Check children
        const children = await db.query.navigationItems.findMany({ where: eq(navigationItems.parentId, id) })
        for (const child of children) {
            await deleteNavigationItem(child.id)
        }

        await db.delete(navigationItems).where(eq(navigationItems.id, id))

        revalidatePath("/dashboard/admin/cms/menus")
        return { success: true }
    } catch (error) {
        console.error("Failed to delete navigation item:", error)
        return { success: false, error: "Failed to delete item" }
    }
}

export async function updateNavigationOrder(items: { id: string, parentId: string | null, order: number }[]) {
    try {
        await db.transaction(async (tx) => {
            for (const item of items) {
                await tx.update(navigationItems)
                    .set({ parentId: item.parentId, order: item.order })
                    .where(eq(navigationItems.id, item.id))
            }
        })
        revalidatePath("/dashboard/admin/cms/menus")
        return { success: true }
    } catch (error) {
        console.error("Failed to reorder items:", error)
        return { success: false, error: "Failed to reorder" }
    }
}
