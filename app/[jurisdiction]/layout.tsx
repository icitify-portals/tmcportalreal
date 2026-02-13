
import { db } from "@/lib/db"
import { organizations, navigationItems } from "@/lib/db/schema"
import { eq, and, asc } from "drizzle-orm"
import Link from "next/link"
import { notFound } from "next/navigation"
import { PromotionWidget } from "@/components/public/ad-widget"

export const dynamic = "force-dynamic"

export default async function JurisdictionLayout({
    children,
    params
}: {
    children: React.ReactNode
    params: Promise<{ jurisdiction: string }>
}) {
    const { jurisdiction } = await params
    const orgCode = jurisdiction.toUpperCase()

    const org = await db.query.organizations.findFirst({
        where: eq(organizations.code, orgCode),
    })

    if (!org) {
        return notFound()
    }

    const menuItems = await db.query.navigationItems.findMany({
        where: and(
            eq(navigationItems.organizationId, org.id),
            eq(navigationItems.isActive, true)
        ),
        orderBy: [asc(navigationItems.order)],
    })

    // Organize menu
    const menuTree = menuItems.filter(i => !i.parentId).map(item => ({
        ...item,
        children: menuItems.filter(child => child.parentId === item.id)
    }))

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center px-4">
                    <Link href={`/${jurisdiction}`} className="mr-6 flex items-center space-x-2">
                        <span className="font-bold text-lg">{org.name}</span>
                    </Link>

                    <nav className="flex items-center space-x-6 text-sm font-medium">
                        {menuTree.map(item => (
                            <div key={item.id} className="relative group">
                                {item.type === 'dropdown' ? (
                                    <span className="cursor-pointer hover:text-foreground/80">{item.label}</span>
                                ) : (
                                    <Link
                                        href={item.path?.startsWith('/') ? `/${jurisdiction}${item.path}` : item.path || '#'}
                                        className="transition-colors hover:text-foreground/80"
                                    >
                                        {item.label}
                                    </Link>
                                )}

                                {item.children.length > 0 && (
                                    <div className="absolute top-full left-0 w-48 bg-popover border rounded-md shadow-md hidden group-hover:block p-2 z-50">
                                        {item.children.map(child => (
                                            <Link
                                                key={child.id}
                                                href={child.path?.startsWith('/') ? `/${jurisdiction}${child.path}` : child.path || '#'}
                                                className="block px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm"
                                            >
                                                {child.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </nav>
                </div>
            </header>

            <main className="flex-1">
                {children}
            </main>

            <div className="container px-4 pb-6 max-w-sm ml-auto mr-4 md:fixed md:bottom-4 md:right-4 md:w-80 md:z-40 pointer-events-none">
                <div className="pointer-events-auto">
                    <PromotionWidget />
                </div>
            </div>

            <footer className="border-t py-6 md:py-0">
                <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row px-4">
                    <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                        © <span suppressHydrationWarning>{new Date().getFullYear()}</span> {org.name}. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    )
}
