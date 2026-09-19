"use server"

import { db } from "@/lib/db"
import {
    assets, assetMaintenanceLogs, organizations,
    assetCategoryEnum, assetConditionEnum, assetStatusEnum, maintenanceTypeEnum,
    users, userRoles
} from "@/lib/db/schema"
import { eq, desc, and, or, aliasedTable, inArray, sql, count, sum } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getServerSession } from "@/lib/session"

// Schemas
const AssetSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    serialNumber: z.string().optional(),
    category: z.enum(['FURNITURE', 'ELECTRONICS', 'VEHICLE', 'PROPERTY', 'EQUIPMENT', 'OTHER']),
    condition: z.enum(['NEW', 'GOOD', 'FAIR', 'POOR', 'DAMAGED', 'LOST']).default('GOOD'),
    status: z.enum(['ACTIVE', 'IN_MAINTENANCE', 'DISPOSED', 'STOLEN', 'ARCHIVED']).default('ACTIVE'),
    purchaseDate: z.date().optional(),
    purchasePrice: z.number().nonnegative().optional(),
    currentValue: z.number().nonnegative().optional(),
    location: z.string().optional(),
    custodianId: z.string().optional(), // User ID
})

const MaintenanceLogSchema = z.object({
    type: z.enum(['REPAIR', 'SERVICE', 'INSPECTION', 'UPGRADE']),
    description: z.string().min(1),
    cost: z.number().nonnegative().default(0),
    date: z.date(),
    performedBy: z.string().optional(),
    nextServiceDate: z.date().optional(),
})

// --- Asset Management ---

export async function createAsset(data: z.infer<typeof AssetSchema>, organizationId: string) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        const validData = AssetSchema.parse(data)

        const [newAsset] = await db.insert(assets).values({
            organizationId,
            ...validData,
            purchasePrice: validData.purchasePrice?.toString() || "0",
            currentValue: validData.currentValue?.toString() || "0",
            updatedAt: new Date(),
        }).$returningId()

        revalidatePath("/dashboard/admin/assets")
        return { success: true, assetId: newAsset.id }
    } catch (error) {
        console.error("Create Asset Error:", error)
        return { success: false, error: "Failed to create asset" }
    }
}

export async function updateAsset(assetId: string, data: Partial<z.infer<typeof AssetSchema>>) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        const currentAsset = await db.query.assets.findFirst({
            where: eq(assets.id, assetId)
        })

        if (!currentAsset) return { success: false, error: "Asset not found" }

        await db.update(assets).set({
            ...data,
            purchasePrice: data.purchasePrice?.toString(),
            currentValue: data.currentValue?.toString(),
            updatedAt: new Date(),
        }).where(eq(assets.id, assetId))

        revalidatePath("/dashboard/admin/assets")
        return { success: true }
    } catch (error) {
        return { success: false, error: "Update failed" }
    }
}

export async function getAssets(organizationId: string) {
    try {
        // Fetch valid org
        const [org] = await db.select().from(organizations).where(eq(organizations.id, organizationId))
        if (!org) return []

        let orgIdsToFetch = [organizationId]

        // Hierarchical Logic
        if (org.level === 'NATIONAL') {
            const allAssets = await db.select({
                asset: assets,
                organization: organizations
            })
                .from(assets)
                .leftJoin(organizations, eq(assets.organizationId, organizations.id))
                .orderBy(desc(assets.createdAt))

            return allAssets.map(r => ({ ...r.asset, organizationName: r.organization?.name, organizationLevel: r.organization?.level }))

        } else if (org.level === 'STATE') {
            const children = await db.select({ id: organizations.id })
                .from(organizations)
                .where(eq(organizations.parentId, organizationId))

            orgIdsToFetch = [organizationId, ...children.map(c => c.id)]
        }

        // Fetch based on gathered IDs
        const result = await db.select({
            asset: assets,
            organization: organizations
        })
            .from(assets)
            .leftJoin(organizations, eq(assets.organizationId, organizations.id))
            .where(inArray(assets.organizationId, orgIdsToFetch))
            .orderBy(desc(assets.createdAt))

        return result.map(r => ({ ...r.asset, organizationName: r.organization?.name, organizationLevel: r.organization?.level }))

    } catch (error) {
        console.error("Get Assets Error:", error)
        return []
    }
}

export async function getAssetById(assetId: string) {
    const result = await db.query.assets.findFirst({
        where: eq(assets.id, assetId),
        with: {
            maintenanceLogs: {
                orderBy: (logs, { desc }) => [desc(logs.date)]
            },
            organization: true,
            custodian: true
        }
    })
    return result
}

// --- Maintenance ---

export async function recordMaintenance(assetId: string, data: z.infer<typeof MaintenanceLogSchema>) {
    try {
        const session = await getServerSession()
        if (!session?.user?.id) return { success: false, error: "Unauthorized" }

        const validData = MaintenanceLogSchema.parse(data)

        await db.insert(assetMaintenanceLogs).values({
            assetId,
            ...validData,
            cost: validData.cost.toString(),
        })

        await db.update(assets).set({ updatedAt: new Date() }).where(eq(assets.id, assetId));

        revalidatePath(`/dashboard/admin/assets`)
        return { success: true }
    } catch (error) {
        return { success: false, error: "Failed to record maintenance" }
    }
}

// --- Reporting ---

export async function getAssetStats(organizationId: string) {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, organizationId))
    if (!org) return null

    let whereCondition = eq(assets.organizationId, organizationId)

    if (org.level === 'NATIONAL') {
        whereCondition = undefined as any 
    } else if (org.level === 'STATE') {
        const children = await db.select({ id: organizations.id }).from(organizations).where(eq(organizations.parentId, organizationId))
        const ids = [organizationId, ...children.map(c => c.id)]
        whereCondition = inArray(assets.organizationId, ids)
    }

    const stats = await db.select({
        totalValue: sum(assets.currentValue),
        totalCount: count(assets.id),
        category: assets.category,
    })
        .from(assets)
        .where(whereCondition)
        .groupBy(assets.category)

    return stats
}

export async function deleteAsset(assetId: string) {
    try {
        const session = await getServerSession();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        await db.delete(assets).where(eq(assets.id, assetId));
        revalidatePath("/dashboard/admin/assets");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to delete asset" };
    }
}

export async function getOrganizationMembers(organizationId: string) {
    try {
        const orgUsers = await db.select({
            id: users.id,
            name: users.name,
            email: users.email
        })
        .from(users)
        .innerJoin(userRoles, eq(users.id, userRoles.userId))
        .where(
            and(
                eq(userRoles.organizationId, organizationId),
                eq(userRoles.isActive, true)
            )
        )
        .groupBy(users.id);

        return orgUsers;
    } catch (error) {
        return [];
    }
}
