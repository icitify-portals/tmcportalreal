export const dynamic = 'force-dynamic'

import { Suspense } from "react"
import { getServerSession } from "@/lib/session"
import { db } from "@/lib/db"
import { organizations } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getNavigationItems } from "@/lib/actions/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, GripVertical, Trash, Edit, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CreateMenuItemDialog } from "@/components/admin/cms/create-menu-item-dialog"
import { deleteNavigationItem } from "@/lib/actions/navigation"
import { revalidatePath } from "next/cache"

export default async function CMSMenusPage() {
    const session = await getServerSession()

    // Determine organization context
    let organizationId = session?.user?.officialOrganizationId ||
        session?.user?.memberOrganizationId ||
        session?.user?.roles?.find((r: any) => r.organizationId)?.organizationId

    // Super Admin Fallback: If no orgId is found, find the National Org
    if (!organizationId && session?.user?.isSuperAdmin) {
        const nationalOrg = await db.query.organizations.findFirst({
            where: eq(organizations.level, "NATIONAL"),
        })
        organizationId = nationalOrg?.id
    }

    if (!organizationId) {
        return (
            <DashboardLayout>
                <div className="p-8 text-center">
                    <h2 className="text-xl font-bold text-destructive">Organization Context Missing</h2>
                    <p className="text-muted-foreground">You must be assigned to an organization to manage menus.</p>
                </div>
            </DashboardLayout>
        )
    }

    const { data: items } = await getNavigationItems(organizationId, true)

    async function handleDelete(id: string) {
        "use server"
        await deleteNavigationItem(id)
    }

    // Helper to render items recursively (though UI usually flattens or just indent)
    // For this simple list management, we just list root items and show children nested visually?
    // Or just a flat list with parent indicator?
    // Reordering usually requires client component. For MVP, just list.

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Menu Management</h2>
                        <p className="text-muted-foreground">Manage navigation links for your jurisdiction site.</p>
                    </div>
                    <CreateMenuItemDialog organizationId={organizationId} />
                </div>

                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Main Navigation</CardTitle>
                            <CardDescription>Drag and drop support coming soon. Currently sorted by Order.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {items?.map((item) => (
                                <div key={item.id} className="border rounded-md p-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 border rounded bg-muted/30 cursor-grab">
                                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{item.label}</span>
                                                {!item.isActive && <Badge variant="secondary">Inactive</Badge>}
                                                {item.type === 'dropdown' && <Badge variant="outline">Dropdown</Badge>}
                                            </div>
                                            <div className="text-xs text-muted-foreground flex gap-2">
                                                <span className="font-mono">{item.path || '#'}</span>
                                                {item.type === 'link' && <ExternalLink className="h-3 w-3" />}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <CreateMenuItemDialog
                                                organizationId={organizationId}
                                                itemToEdit={{
                                                    ...item,
                                                    type: item.type || 'link',
                                                    organizationId: item.organizationId || undefined,
                                                    path: item.path || undefined,
                                                    isActive: item.isActive ?? true,
                                                    parentId: item.parentId
                                                }}
                                                trigger={
                                                    <Button variant="ghost" size="sm">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                }
                                            />
                                            <form action={handleDelete.bind(null, item.id)}>
                                                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                                    <Trash className="h-4 w-4" />
                                                </Button>
                                            </form>

                                            {item.type === 'dropdown' && (
                                                <CreateMenuItemDialog
                                                    organizationId={organizationId}
                                                    parentId={item.id}
                                                    trigger={
                                                        <Button variant="ghost" size="sm" title="Add Child Link">
                                                            <Plus className="h-4 w-4" />
                                                        </Button>
                                                    }
                                                />
                                            )}
                                        </div>
                                    </div>

                                    {/* Render Children */}
                                    {item.children && item.children.length > 0 && (
                                        <div className="ml-10 mt-3 space-y-2 border-l-2 pl-4">
                                            {item.children.map(child => (
                                                <div key={child.id} className="flex items-center gap-3 py-2">
                                                    <div className="flex-1">
                                                        <span className="text-sm font-medium">{child.label}</span>
                                                        <div className="text-xs text-muted-foreground font-mono">{child.path}</div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <CreateMenuItemDialog
                                                            organizationId={organizationId}
                                                            itemToEdit={{
                                                                ...child,
                                                                type: child.type || 'link',
                                                                organizationId: child.organizationId || undefined,
                                                                path: child.path || undefined,
                                                                isActive: child.isActive ?? true,
                                                                parentId: child.parentId
                                                            }}
                                                            trigger={
                                                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                                                    <Edit className="h-3 w-3" />
                                                                </Button>
                                                            }
                                                        />
                                                        <form action={handleDelete.bind(null, child.id)}>
                                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500 hover:bg-red-50">
                                                                <Trash className="h-3 w-3" />
                                                            </Button>
                                                        </form>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {(!items || items.length === 0) && (
                                <div className="text-center py-8 text-muted-foreground">
                                    No menu items found. Create your first link!
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    )
}

