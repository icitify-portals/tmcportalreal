import { db } from "@/lib/db"
import { officials, users, organizations } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { notFound } from "next/navigation"
import Image from "next/image"
import { PageHeader } from "@/components/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Shield, MapPin, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getOrganizationHierarchy, formatHierarchyNames } from "@/lib/org-utils"
import { ClientDate } from "@/components/ui/client-date"

export const dynamic = "force-dynamic"

interface PageProps {
    params: Promise<{ executiveId: string }>
}

export default async function ExecutiveProfilePage({ params }: PageProps) {
    const { executiveId } = await params

    // Fetch primary official data
    const rawOfficial = await db.query.officials.findFirst({
        where: eq(officials.id, executiveId)
    })

    if (!rawOfficial) {
        notFound()
    }

    // Fetch related user
    const userData = await db.query.users.findFirst({
        where: eq(users.id, rawOfficial.userId)
    })

    // Fetch hierarchy
    const hierarchy = await getOrganizationHierarchy(rawOfficial.organizationId)
    const jurisdictionPath = formatHierarchyNames(hierarchy)

    const official = {
        ...rawOfficial,
        user: userData,
        jurisdiction: jurisdictionPath
    }

    return (
        <div className="flex flex-col min-h-screen bg-muted/30 pb-12">
            <PageHeader />

            <main className="container mx-auto max-w-4xl flex-1 p-4 md:p-8 space-y-6">
                <Link href="/">
                    <Button variant="ghost" size="sm" className="mb-4">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Home
                    </Button>
                </Link>

                <Card className="overflow-hidden border-none shadow-xl bg-background/50 backdrop-blur">
                    <div className="relative h-[400px] w-full">
                        <Image
                            src={official.image || official.user?.image || "/images/placeholder-avatar.png"}
                            alt={`Portrait of ${official.user?.name}`}
                            fill
                            className="object-cover"
                            priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-green-950/90 via-green-950/40 to-transparent" />
                        <div className="absolute bottom-0 left-0 p-8 text-white space-y-2">
                            <div className="inline-flex items-center gap-2 bg-green-500/20 backdrop-blur-md px-3 py-1 rounded-full border border-green-500/30 text-xs font-bold uppercase tracking-wider">
                                <Shield className="h-3 w-3" />
                                {official.positionLevel} Official
                            </div>
                            <h1 className="text-5xl font-bold tracking-tight">{official.user?.name}</h1>
                            <p className="text-2xl font-light text-green-100/90">{official.position}</p>
                        </div>
                    </div>

                    <CardContent className="p-8 grid grid-cols-1 md:grid-cols-12 gap-12">
                        <div className="md:col-span-8 space-y-8">
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4 border-l-4 border-primary pl-4">About the Official</h3>
                                {official.bio ? (
                                    <div
                                        className="prose prose-green dark:prose-invert max-w-none text-muted-foreground leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: official.bio }}
                                    />
                                ) : (
                                    <p className="text-muted-foreground italic">No detailed profile has been added for this executive yet.</p>
                                )}
                            </div>
                        </div>

                        <div className="md:col-span-4 space-y-6">
                            <div className="bg-muted/50 p-6 rounded-2xl border space-y-6">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
                                        <MapPin className="h-3 w-3" />
                                        Jurisdiction
                                    </div>
                                    <p className="text-sm font-semibold">{official.jurisdiction}</p>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
                                        <Calendar className="h-3 w-3" />
                                        Term Period
                                    </div>
                                    <p className="text-sm font-semibold">
                                        <ClientDate date={official.termStart} /> - {official.termEnd ? <ClientDate date={official.termEnd} /> : 'Present'}
                                    </p>
                                </div>

                                <div className="pt-4 border-t">
                                    <Button className="w-full bg-green-700 hover:bg-green-800 text-white shadow-lg">
                                        Contact Official
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </main>

            <footer className="mt-12 py-8 border-t bg-background/50 backdrop-blur">
                <div className="container mx-auto text-center text-muted-foreground text-sm">
                    <p>&copy; <span suppressHydrationWarning>{new Date().getFullYear()}</span> The Muslim Congress. Empowering the Ummah.</p>
                </div>
            </footer>
        </div>
    )
}
