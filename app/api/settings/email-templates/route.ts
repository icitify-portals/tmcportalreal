import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { db } from "@/lib/db";
import { emailTemplates } from "@/lib/db/schema";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session?.user?.isSuperAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const templates = await db.select().from(emailTemplates);

        // Parse JSON variables
        const templatesWithParsedVars = templates.map((template) => ({
            ...template,
            variables: template.variables ? JSON.parse(template.variables as string) : null,
        }));

        return NextResponse.json({ templates: templatesWithParsedVars });
    } catch (error) {
        console.error("Error fetching templates:", error);
        return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
    }
}
