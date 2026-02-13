import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/session"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"

const saveKeysSchema = z.object({
    publicKey: z.string(),
    encryptedPrivateKey: z.string(),
    salt: z.string(),
    encryptedPrivateKeyRecovery: z.string(),
    recoveryKeyHash: z.string()
})

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession()
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const json = await request.json()
        const body = saveKeysSchema.parse(json)

        await db.update(users)
            .set({
                publicKey: body.publicKey,
                encryptedPrivateKey: body.encryptedPrivateKey,
                salt: body.salt,
                encryptedPrivateKeyRecovery: body.encryptedPrivateKeyRecovery,
                recoveryKeyHash: body.recoveryKeyHash
            })
            .where(eq(users.id, session.user.id))

        return NextResponse.json({ success: true })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession()
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const user = await db.query.users.findFirst({
            where: eq(users.id, session.user.id),
            columns: {
                publicKey: true,
                encryptedPrivateKey: true,
                salt: true,
                encryptedPrivateKeyRecovery: true,
                recoveryKeyHash: true
            }
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Return keys (if they exist) so client knows if setup is done
        return NextResponse.json(user)

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
