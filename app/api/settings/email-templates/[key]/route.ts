import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { db } from "@/lib/db";
import { emailTemplates } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ key: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession();
        if (!session?.user?.isSuperAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const template = await db.select()
            .from(emailTemplates)
            .where(eq(emailTemplates.templateKey, params.key))
            .limit(1);

        if (template.length === 0) {
            return NextResponse.json({ error: "Template not found" }, { status: 404 });
        }

        return NextResponse.json({ template: template[0] });
    } catch (error) {
        console.error("Error fetching template:", error);
        return NextResponse.json({ error: "Failed to fetch template" }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    props: { params: Promise<{ key: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession();
        if (!session?.user?.isSuperAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { subject, htmlBody, textBody } = body;

        await db.update(emailTemplates)
            .set({
                subject,
                htmlBody,
                textBody,
                updatedAt: new Date(),
            })
            .where(eq(emailTemplates.templateKey, params.key));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating template:", error);
        return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
    }
}
