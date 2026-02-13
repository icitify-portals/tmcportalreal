export const dynamic = 'force-dynamic'
import { Suspense } from "react"
import { getServerSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { users, officials, userRoles, roles, organizations } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { getGalleries } from "@/lib/actions/galleries"
import { CreateGalleryDialog } from "@/components/admin/galleries/create-gallery-dialog"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Image as ImageIcon, ArrowRight } from "lucide-react"
import Link from "next/link"
import { DashboardLayout } from "@/components/layout/dashboard-layout"


async function GalleriesList({ organizationId }: { organizationId: string }) {
    const galleries = await getGalleries(organizationId)

    if (galleries.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
                <ImageIcon className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No Galleries</h3>
                <p className="text-muted-foreground text-sm mb-4">Create your first gallery to start adding photos.</p>
                <CreateGalleryDialog organizationId={organizationId} />
            </div>
        )
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {galleries.map((gallery) => (
                <Card key={gallery.id} className="overflow-hidden">
                    <div className="aspect-video bg-muted relative flex items-center justify-center">
                        {gallery.images && gallery.images.length > 0 ? (
                            <img
                                src={gallery.images[0].imageUrl}
                                alt={gallery.title}
                                className="object-cover w-full h-full"
                            />
                        ) : (
                            <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                        )}
                    </div>
                    <CardHeader>
                        <CardTitle className="line-clamp-1">{gallery.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                            {gallery.description || "No description"}
                        </p>
                    </CardContent>
                    <CardFooter>
                        <Link href={`/dashboard/admin/galleries/${gallery.id}`} className="w-full">
                            <Button variant="outline" className="w-full">
                                Manage Photos <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}

export default async function GalleriesPage() {
    const session = await getServerSession()
    if (!session?.user?.id) return redirect("/auth/login")

    // Fetch user's org with fallback logic
    const userResult = await db.select({
        user: users,
        officialProfile: officials
    })
        .from(users)
        .leftJoin(officials, eq(users.id, officials.userId))
        .where(eq(users.id, session.user.id))
        .limit(1)

    const user = userResult[0] ? {
        ...userResult[0].user,
        officialProfile: userResult[0].officialProfile
    } : null

    // Hierarchy of checks: Official -> Role -> Session -> National
    let organizationId = user?.officialProfile?.organizationId

    if (!organizationId) {
        // Check User Roles
        const userRolesList = await db.select({
            organizationId: userRoles.organizationId
        })
            .from(userRoles)
            .innerJoin(roles, eq(userRoles.roleId, roles.id))
            .where(
                and(
                    eq(userRoles.userId, session.user.id),
                    eq(userRoles.isActive, true)
                )
            )
            .limit(1)

        organizationId = userRolesList[0]?.organizationId ?? undefined
    }

    if (!organizationId) {
        // Fallback to session organization
        organizationId = session.user.organizationId
    }

    if (!organizationId) {
        // Final Fallback: National Organization
        const nationalOrg = await db.select({ id: organizations.id })
            .from(organizations)
            .where(eq(organizations.level, 'NATIONAL'))
            .limit(1)

        organizationId = nationalOrg[0]?.id
    }

    if (!organizationId) {
        return <div className="p-8">Unauthorized: No Organization Assigned</div>
    }

    return (
        <DashboardLayout>
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Galleries</h2>
                    <CreateGalleryDialog organizationId={organizationId} />
                </div>

                <Suspense fallback={<div>Loading galleries...</div>}>
                    <GalleriesList organizationId={organizationId} />
                </Suspense>
            </div>
        </DashboardLayout>
    )
}

