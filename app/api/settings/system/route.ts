import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { db } from "@/lib/db";
import { systemSettings } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session?.user?.isSuperAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const category = searchParams.get("category");

        const where = category ? eq(systemSettings.category, category as any) : undefined;

        const settings = await db.select()
            .from(systemSettings)
            .where(where);

        // Convert to key-value object
        const settingsObj: Record<string, string> = {};
        settings.forEach((setting) => {
            settingsObj[setting.settingKey] = setting.settingValue || "";
        });

        return NextResponse.json({ settings: settingsObj });
    } catch (error) {
        console.error("Error fetching settings:", error);
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session?.user?.isSuperAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { settings: settingsToUpdate } = body;

        if (!settingsToUpdate || typeof settingsToUpdate !== "object") {
            return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
        }

        // Update each setting
        for (const [key, value] of Object.entries(settingsToUpdate)) {
            // Check if setting exists
            const existing = await db.select()
                .from(systemSettings)
                .where(eq(systemSettings.settingKey, key))
                .limit(1);

            if (existing.length > 0) {
                // Update existing
                await db.update(systemSettings)
                    .set({
                        settingValue: value as string,
                        updatedBy: session.user.id,
                        updatedAt: new Date(),
                    })
                    .where(eq(systemSettings.settingKey, key));
            } else {
                // Insert new (determine category from key prefix)
                let category: "EMAIL" | "NOTIFICATION" | "GENERAL" = "GENERAL";
                if (key.startsWith("email.")) category = "EMAIL";
                else if (key.startsWith("notification.")) category = "NOTIFICATION";

                await db.insert(systemSettings).values({
                    id: uuidv4(),
                    settingKey: key,
                    settingValue: value as string,
                    category,
                    updatedBy: session.user.id,
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating settings:", error);
        return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
    }
}
