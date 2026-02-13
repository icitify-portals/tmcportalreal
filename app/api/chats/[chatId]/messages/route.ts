import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/session"
import { db } from "@/lib/db"
import { messages, chatParticipants, chats, notifications } from "@/lib/db/schema"
import { eq, and, desc, asc } from "drizzle-orm"
import { z } from "zod"

const sendMessageSchema = z.object({
    content: z.string().optional(),
    mediaUrl: z.string().optional(),
    type: z.enum(['TEXT', 'IMAGE', 'E2AE']).default('TEXT'),
    encryptedKeys: z.record(z.string(), z.string()).optional() // { userId: encryptedKey }
}).refine(data => data.content || data.mediaUrl, {
    message: "Message must contain text or media"
})

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ chatId: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession()
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const chatId = params.chatId

        // Verify membership
        const membership = await db.query.chatParticipants.findFirst({
            where: and(
                eq(chatParticipants.chatId, chatId),
                eq(chatParticipants.userId, session.user.id)
            )
        })

        if (!membership) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const chatMessages = await db.query.messages.findMany({
            where: eq(messages.chatId, chatId),
            orderBy: [asc(messages.createdAt)],
            with: {
                sender: {
                    columns: {
                        id: true,
                        name: true,
                        image: true
                    }
                }
            }
        })

        const participants = await db.query.chatParticipants.findMany({
            where: eq(chatParticipants.chatId, chatId),
            with: {
                user: {
                    columns: {
                        id: true,
                        name: true,
                        image: true,
                        publicKey: true
                    }
                }
            }
        })

        return NextResponse.json({
            messages: chatMessages,
            participants: participants.map(p => p.user)
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(
    request: NextRequest,
    props: { params: Promise<{ chatId: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession()
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const chatId = params.chatId
        const json = await request.json()
        const body = sendMessageSchema.parse(json)

        // Verify membership
        const membership = await db.query.chatParticipants.findFirst({
            where: and(
                eq(chatParticipants.chatId, chatId),
                eq(chatParticipants.userId, session.user.id)
            )
        })

        if (!membership) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        // Create Message
        await db.insert(messages).values({
            chatId: chatId,
            senderId: session.user.id,
            content: body.content,
            mediaUrl: body.mediaUrl,
            readBy: [session.user.id], // Auto read by sender
            type: body.type,
            encryptedKeys: body.encryptedKeys
        })

        // Update Chat timestamp
        await db.update(chats)
            .set({ updatedAt: new Date() })
            .where(eq(chats.id, chatId))

        // NOTIFICATIONS (Optional but good)
        // We could fetch other participants and create notification records
        // For MVP speed, skipping broadcast, client will poll or assume active.

        return NextResponse.json({ success: true })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
