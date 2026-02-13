import { db } from "@/lib/db"
import { specialProgrammes, specialProgrammeFiles } from "@/lib/db/schema"
import { eq, asc } from "drizzle-orm"
import { notFound, redirect } from "next/navigation"
import { getServerSession } from "@/lib/session"
import { SpecialProgrammeForm } from "@/components/admin/special-programmes/special-programme-form"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function EditSpecialProgrammePage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const session = await getServerSession()
    if (!session?.user?.id) redirect("/login")

    const itemData = await db.query.specialProgrammes.findFirst({
        where: eq(specialProgrammes.id, id),
    })

    if (!itemData) notFound()

    // Manually fetch files to avoid LATERAL JOIN in older MariaDB
    const files = await db.query.specialProgrammeFiles.findMany({
        where: eq(specialProgrammeFiles.programmeId, id),
        orderBy: (files, { asc }) => [asc(files.order)]
    })
    const item = { ...itemData, files };

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight text-green-700">Edit Archive</h2>
                    <p className="text-sm text-muted-foreground">
                        Update programme details or manage media resources.
                    </p>
                </div>
                <Button variant="ghost" asChild>
                    <Link href="/dashboard/admin/special-programmes">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Archive
                    </Link>
                </Button>
            </div>

            <div className="max-w-4xl mx-auto">
                <Card className="border-green-100 shadow-sm">
                    <CardHeader className="bg-green-50/50">
                        <CardTitle>Manage Edition</CardTitle>
                        <CardDescription>
                            Updating {item.title} ({item.year}).
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <p className="text-sm text-yellow-600 mb-4 bg-yellow-50 p-2 rounded border border-yellow-100">
                            Note: Editing an archive updates the global library.
                        </p>
                        <SpecialProgrammeForm initialData={item} />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
