import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/session"
import { getOrganizationTree } from "@/lib/org-helper"

export async function GET() {
    const session = await getServerSession()
    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    try {
        const tree = await getOrganizationTree()
        return NextResponse.json(tree)
    } catch (error) {
        console.error("Organization tree error:", error)
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }
}
