import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        await db.execute(sql`ALTER TABLE meetings ADD COLUMN targetAudience ENUM('OFFICIALS_ONLY', 'ALL_MEMBERS_JURISDICTION', 'ALL_MEMBERS_GLOBAL') DEFAULT 'ALL_MEMBERS_JURISDICTION'`);
        return NextResponse.json({ success: true, message: "Migration applied" });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message });
    }
}
