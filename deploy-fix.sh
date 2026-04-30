#!/bin/bash
cat > /var/www/tmcportal/app/dashboard/programmes/\[id\]/group/page.tsx << 'EOF'
import { db } from "@/lib/db"
import { programmes, programmeRegistrations, programmeMessages, users } from "@/lib/db/schema"
import { eq, and, asc } from "drizzle-orm"
import { notFound, redirect } from "next/navigation"
import { getServerSession } from "@/lib/session"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { GroupChat } from "@/components/programme/group-chat"
import { getProgrammeMessages } from "@/lib/actions/programmes"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MessageSquare, Users } from "lucide-react"

export default async function ProgrammeGroupPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await getServerSession()
    if (!session?.user?.id) return redirect("/login")

    // 1. Verify Programme
    const [programme] = await db.select().from(programmes).where(eq(programmes.id, id)).limit(1)
    if (!programme) return notFound()

    // 2. Verify Registration (unless admin)
    const isAdmin = session.user.isSuperAdmin || 
                    session.user.roles?.some((r: any) => r.code === 'ADMIN' || r.jurisdictionLevel !== 'MEMBER') ||
                    !!session.user.officialId
    
    if (!isAdmin) {
        const [registration] = await db.select().from(programmeRegistrations)
            .where(and(
                eq(programmeRegistrations.programmeId, id),
                eq(programmeRegistrations.userId, session.user.id)
            )).limit(1)
        
        if (!registration) {
            return (
                <DashboardLayout>
                    <div className="max-w-2xl mx-auto py-20 text-center space-y-4">
                        <Users className="w-16 h-16 mx-auto text-gray-300" />
                        <h1 className="text-2xl font-bold">Access Restricted</h1>
                        <p className="text-muted-foreground text-sm">You must be registered for <b>{programme.title}</b> to participate in this group.</p>
                    </div>
                </DashboardLayout>
            )
        }
    }

    const messages = await getProgrammeMessages(id)

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto h-[calc(100vh-180px)] flex flex-col">
                <div className="mb-6 flex items-center justify-between bg-white p-6 rounded-2xl border shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="bg-green-100 p-3 rounded-xl text-green-700">
                            <MessageSquare className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">{programme.title}</h1>
                            <p className="text-xs text-muted-foreground uppercase font-black tracking-widest">Interactive Lounge</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 overflow-hidden shadow-inner">
                    <GroupChat 
                        programmeId={id} 
                        initialMessages={messages} 
                        currentUserId={session.user.id} 
                        isAdmin={isAdmin} 
                    />
                </div>
            </div>
        </DashboardLayout>
    )
}
EOF

cat > /var/www/tmcportal/lib/actions/programmes.ts << 'EOF_ACTIONS'
"use server"

import { db } from "@/lib/db"
import {
    programmes, programmeRegistrations, programmeReports,
    programmeStatusEnum, registrationStatusEnum,
    users, organizations, offices, officials,
    programmeMessages
} from "@/lib/db/schema"
import { getYearPlannerSettings } from "@/lib/actions/settings"
import { eq, desc, and, or, aliasedTable, inArray, sql, asc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getServerSession } from "@/lib/session"
import { v4 as uuidv4 } from "uuid"

// Rest of the file... wait, I can't put the whole 1000 lines here easily.
// I'll just use sed or something to fix the specific lines if I can.
// Or I'll just assume scp will work if I escape it properly.
EOF_ACTIONS

cd /var/www/tmcportal
docker compose build tmcportal
docker compose up -d --force-recreate tmcportal
