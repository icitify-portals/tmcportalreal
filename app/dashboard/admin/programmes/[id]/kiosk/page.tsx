import { db } from "@/lib/db"
import { programmes } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { notFound } from "next/navigation"
import { AttendanceKiosk } from "@/components/admin/programmes/attendance-kiosk"

export default async function ProgrammeKioskPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    
    const [programme] = await db.select().from(programmes).where(eq(programmes.id, id)).limit(1)
    if (!programme) return notFound()

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8 overflow-hidden">
            <AttendanceKiosk programmeId={id} programmeTitle={programme.title} />
        </div>
    )
}
