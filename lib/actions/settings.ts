"use server"

import { db } from "@/lib/db"
import { systemSettings } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { getServerSession } from "@/lib/session"
import { requireAdmin } from "@/lib/rbac"

export interface AISettings {
    enabled: boolean
    provider: "gemini" | "deepseek"
    systemPrompt?: string
}

export interface MembershipSettings {
    registrationEnabled: boolean
    recommendationRequired: boolean
}

const DEFAULT_AI_SETTINGS: AISettings = {
    enabled: true,
    provider: "deepseek", // Set as default per user request
    systemPrompt: ""
}

const DEFAULT_MEMBERSHIP_SETTINGS: MembershipSettings = {
    registrationEnabled: true,
    recommendationRequired: false
}

export async function getAISettings(): Promise<AISettings> {
    const session = await getServerSession()
    if (!session?.user) return DEFAULT_AI_SETTINGS // Safe default for unauth (though UI is protected)

    try {
        const settings = await db.select().from(systemSettings).where(eq(systemSettings.category, "AI"))

        // Map individual rows to a config object
        const config: any = { ...DEFAULT_AI_SETTINGS }

        settings.forEach(s => {
            if (s.settingKey === "ai_enabled") config.enabled = s.settingValue === "true"
            if (s.settingKey === "ai_provider") config.provider = s.settingValue
            if (s.settingKey === "ai_system_prompt") config.systemPrompt = s.settingValue
        })

        return config
    } catch (error) {
        console.error("Failed to fetch AI settings (DB Error), using defaults:", error);
        return DEFAULT_AI_SETTINGS;
    }
}

export async function updateAISettings(data: AISettings) {
    const session = await getServerSession()
    if (!session?.user?.id) {
        throw new Error("Unauthorized")
    }
    requireAdmin(session) // Ensure only admins can change this

    // Helper to upsert a setting
    const upsertSetting = async (key: string, value: string) => {
        const existing = await db.select().from(systemSettings).where(eq(systemSettings.settingKey, key))
        if (existing.length > 0) {
            await db.update(systemSettings)
                .set({ settingValue: value, updatedBy: session.user.id })
                .where(eq(systemSettings.settingKey, key))
        } else {
            await db.insert(systemSettings).values({
                settingKey: key,
                settingValue: value,
                category: "AI",
                updatedBy: session.user.id
            })
        }
    }

    await upsertSetting("ai_enabled", String(data.enabled))
    await upsertSetting("ai_provider", data.provider)
    if (data.systemPrompt !== undefined) {
        await upsertSetting("ai_system_prompt", data.systemPrompt || "")
    }

    revalidatePath("/dashboard/admin/settings")
    return { success: true }
}

export async function getMembershipSettings(): Promise<MembershipSettings> {
    const session = await getServerSession()
    if (!session?.user) return DEFAULT_MEMBERSHIP_SETTINGS

    try {
        const settings = await db.select().from(systemSettings).where(eq(systemSettings.category, "GENERAL"))

        const config: MembershipSettings = { ...DEFAULT_MEMBERSHIP_SETTINGS }

        settings.forEach(s => {
            if (s.settingKey === "membership_registration_enabled") config.registrationEnabled = s.settingValue === "true"
            if (s.settingKey === "membership_recommendation_required") config.recommendationRequired = s.settingValue === "true"
        })

        return config
    } catch (error) {
        console.error("Failed to fetch membership settings:", error);
        return DEFAULT_MEMBERSHIP_SETTINGS;
    }
}

export async function updateMembershipSettings(data: MembershipSettings) {
    const session = await getServerSession()
    if (!session?.user?.id) {
        throw new Error("Unauthorized")
    }
    requireAdmin(session)

    const upsertSetting = async (key: string, value: string) => {
        const existing = await db.select().from(systemSettings).where(eq(systemSettings.settingKey, key))
        if (existing.length > 0) {
            await db.update(systemSettings)
                .set({ settingValue: value, updatedBy: session.user.id })
                .where(eq(systemSettings.settingKey, key))
        } else {
            await db.insert(systemSettings).values({
                settingKey: key,
                settingValue: value,
                category: "GENERAL",
                updatedBy: session.user.id
            })
        }
    }

    await upsertSetting("membership_registration_enabled", String(data.registrationEnabled))
    await upsertSetting("membership_recommendation_required", String(data.recommendationRequired))

    revalidatePath("/dashboard/admin/settings")
    return { success: true }
}
