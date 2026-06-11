import { Suspense } from "react"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { organizations } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { ProgrammeGrid } from "@/components/programmes/programme-grid"
import Link from "next/link"
import { ArrowLeft, CalendarIcon } from "lucide-react"

export const dynamic = "force-dynamic"

interface PageProps {
    params: Promise<{ jurisdiction: string }>
}

export default async function JurisdictionProgrammesPage(props: PageProps) {
    const params = await props.params;
    const orgCode = params.jurisdiction.toUpperCase()

    const org = await db.query.organizations.findFirst({
        where: eq(organizations.code, orgCode),
    })

    if (!org) {
        return notFound()
    }

    return (
        <div className="min-h-screen bg-background pb-12">
            {/* Header / Nav Back */}
            <div className="bg-muted py-4">
                <div className="container px-4 md:px-6">
                    <Link href={`/${params.jurisdiction}`} className="flex items-center text-sm text-muted-foreground hover:text-primary">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to {org.name}
                    </Link>
                </div>
            </div>

            {/* Hero Section */}
            <div className="bg-green-700 text-white py-12 mb-8">
                <div className="container mx-auto px-4 max-w-7xl flex items-center gap-4">
                    <div className="bg-green-600 p-4 rounded-full hidden md:block">
                        <CalendarIcon className="h-10 w-10 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight lg:text-5xl mb-4">Upcoming Programmes</h1>
                        <p className="text-green-50 text-lg max-w-2xl">
                            Explore activities and events happening in {org.name}.
                        </p>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 max-w-7xl">
                <Suspense fallback={
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-80 bg-gray-100 rounded-lg animate-pulse border" />
                        ))}
                    </div>
                }>
                    <ProgrammeGrid organizationCode={org.code} />
                </Suspense>
            </div>
        </div>
    )
}
