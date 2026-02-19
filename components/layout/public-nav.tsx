"use client"
import { useState, useEffect } from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Home, LayoutDashboard, Calendar, Heart, Menu, Building2 } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"

export function PublicNav() {
    const [isOpen, setIsOpen] = useState(false)
    const [mounted, setMounted] = useState(false)
    const pathname = usePathname()

    useEffect(() => {
        setMounted(true)
    }, [])

    const items = [
        {
            title: "Home",
            href: "/",
            icon: Home
        },
        {
            title: "Dashboard",
            href: "/dashboard",
            icon: LayoutDashboard
        },
        {
            title: "Programmes",
            href: "/programmes",
            icon: Calendar
        },
        {
            title: "Our Organs",
            href: "/organs",
            icon: Building2
        },
        {
            title: "Donate",
            href: "/donate",
            icon: Heart
        }
    ]

    if (!mounted) {
        return (
            <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
                <div className="container flex h-14 items-center max-w-7xl mx-auto px-4">
                    <div className="mr-4 flex">
                        <span className="font-bold">TMC Portal</span>
                    </div>
                </div>
            </nav>
        )
    }

    return (
        <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="container flex h-14 items-center max-w-7xl mx-auto px-4">
                <div className="mr-4 hidden md:flex">
                    <Link href="/" className="mr-6 flex items-center space-x-2">
                        <span className="hidden font-bold sm:inline-block">
                            TMC Portal
                        </span>
                    </Link>
                    <div className="flex gap-6 text-sm font-medium">
                        {items.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "transition-colors hover:text-foreground/80",
                                    pathname === item.href ? "text-foreground" : "text-foreground/60"
                                )}
                            >
                                {item.title}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Mobile View */}
                <div className="flex flex-1 items-center justify-between space-x-2 md:hidden">
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="pr-0">
                            <SheetTitle className="sr-only">Site Navigation</SheetTitle>
                            <div className="px-7">
                                <Link
                                    href="/"
                                    className="flex items-center"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <span className="font-bold text-xl">TMC Portal</span>
                                </Link>
                            </div>
                            <div className="flex flex-col gap-4 mt-8 px-7">
                                {items.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-2 text-lg font-medium transition-colors hover:text-primary",
                                            pathname === item.href ? "text-foreground" : "text-muted-foreground"
                                        )}
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <item.icon className="h-5 w-5" />
                                        {item.title}
                                    </Link>
                                ))}
                            </div>
                            <div className="mt-8 px-7 border-t pt-8">
                                <div className="flex gap-4">
                                    <Button className="w-full" asChild onClick={() => setIsOpen(false)}>
                                        <Link href="/auth/signin">Sign In</Link>
                                    </Button>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>

                    <span className="font-bold">TMC</span>

                    {/* Keep Donate/Action button visible on mobile if space permits, or just rely on menu */}
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/donate">
                            <Heart className="h-5 w-5" />
                        </Link>
                    </Button>
                </div>

                <div className="flex flex-1 items-center justify-end space-x-2">
                    {/* Auth buttons could go here */}
                </div>
            </div>
        </nav>
    )
}
