'use server'

import { db } from "@/lib/db"
import { organizations } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createOrganization(formData: FormData) {
    const rawData = {
        name: formData.get("name") as string,
        level: formData.get("level") as "NATIONAL" | "STATE" | "LOCAL_GOVERNMENT" | "BRANCH",
        parentId: formData.get("parentId") as string || null,
        code: formData.get("code") as string,
        address: formData.get("address") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
        sliderImages: formData.get("sliderImages") ? JSON.parse(formData.get("sliderImages") as string) : [],
    }

    // Basic validation
    if (!rawData.name || !rawData.level || !rawData.code) {
        return { success: false, error: "Missing required fields" }
    }

    try {
        await db.insert(organizations).values({
            name: rawData.name,
            level: rawData.level,
            parentId: rawData.parentId,
            code: rawData.code,
            address: rawData.address,
            email: rawData.email,
            phone: rawData.phone,
            sliderImages: rawData.sliderImages,
            country: 'Nigeria', // Default
        })

        revalidatePath("/dashboard/admin/organizations")
        return { success: true }
    } catch (error: any) {
        console.error("Failed to create organization:", error)
        return { success: false, error: error.message || "Failed to create organization" }
    }
}

export async function deleteOrganization(orgId: string) {
    if (!orgId) return { success: false, error: "Organization ID required" }

    try {
        // Check for children
        const children = await db.query.organizations.findFirst({
            where: eq(organizations.parentId, orgId)
        })

        if (children) {
            return {
                success: false,
                error: "Cannot delete organization with sub-organizations. Please delete children first."
            }
        }

        await db.delete(organizations).where(eq(organizations.id, orgId))

        revalidatePath("/dashboard/admin/organizations")
        return { success: true }
    } catch (error: any) {
        console.error("Failed to delete organization:", error)
        return { success: false, error: "Failed to delete organization" }
    }
}

export async function updateOrganization(orgId: string, formData: FormData) {
    // Basic validation
    const rawData = {
        name: formData.get("name") as string,
        level: formData.get("level") as "NATIONAL" | "STATE" | "LOCAL_GOVERNMENT" | "BRANCH",
        parentId: formData.get("parentId") as string || null,
        code: formData.get("code") as string,
        address: formData.get("address") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
        sliderImages: formData.get("sliderImages") ? JSON.parse(formData.get("sliderImages") as string) : undefined,
    }

    if (!orgId) return { success: false, error: "Organization ID required" }
    if (!rawData.name || !rawData.level || !rawData.code) {
        return { success: false, error: "Missing required fields" }
    }

    try {
        await db.update(organizations).set({
            name: rawData.name,
            level: rawData.level,
            parentId: rawData.parentId,
            code: rawData.code,
            address: rawData.address,
            email: rawData.email,
            phone: rawData.phone,
            sliderImages: rawData.sliderImages,
        }).where(eq(organizations.id, orgId))

        revalidatePath("/dashboard/admin/organizations")
        return { success: true }
    } catch (error: any) {
        console.error("Failed to update organization:", error)
        return { success: false, error: error.message || "Failed to update organization" }
    }
}

export async function updateOrganizationPlanningSettings(orgId: string, month: number, day: number) {
    if (!orgId) return { success: false, error: "Organization ID required" }

    try {
        await db.update(organizations).set({
            planningDeadlineMonth: month,
            planningDeadlineDay: day,
        }).where(eq(organizations.id, orgId))

        revalidatePath(`/dashboard/admin/organizations/${orgId}`)
        return { success: true }
    } catch (error: any) {
        console.error("Failed to update planning settings:", error)
        return { success: false, error: "Failed to update settings" }
    }
}
