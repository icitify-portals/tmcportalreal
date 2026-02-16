"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ChevronDown, Menu, LogOut, LogIn } from "lucide-react"
import { useSession, signOut } from "next-auth/react"

interface NavbarClientProps {
    items: any[]
}

export function NavbarClient({ items }: NavbarClientProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [mounted, setMounted] = useState(false)
    const { data: session } = useSession()

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                {items.map((item: any) => (
                    <span key={item.id} className="text-green-100 opacity-60">
                        {item.label}
                    </span>
                ))}
            </nav>
        )
    }

    return (
        <>
            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                {items.map((item: any) => {
                    if (item.type === "dropdown" && item.children?.length > 0) {
                        return (
                            <DropdownMenu key={item.id}>
                                <DropdownMenuTrigger className="flex items-center gap-1 text-green-100 hover:text-white transition-colors outline-none">
                                    {item.label} <ChevronDown className="h-3 w-3" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    {item.children.map((child: any) => (
                                        <DropdownMenuItem key={child.id} asChild>
                                            <Link href={child.path || "#"} className="cursor-pointer">
                                                {child.label}
                                            </Link>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )
                    }

                    const isDashboard = item.path === "/dashboard"
                    const label = (isDashboard && !session) ? "Sign In" : item.label
                    const path = (isDashboard && !session) ? "/auth/signin" : (item.path || "#")

                    return (
                        <Link
                            key={item.id}
                            href={path}
                            className="text-green-100 hover:text-white transition-colors"
                        >
                            {label}
                        </Link>
                    )
                })}
            </nav>

            {/* Mobile Nav Trigger */}
            <div className="md:hidden">
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-green-800">
                            <Menu className="h-6 w-6" />
                            <span className="sr-only">Toggle menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[300px] sm:w-[350px] overflow-y-auto">
                        <SheetTitle className="sr-only">TMC Portal Navigation</SheetTitle>
                        <div className="flex flex-col gap-6 mt-6">
                            <Link href="/" className="font-bold text-xl px-2 mb-4" onClick={() => setIsOpen(false)}>
                                TMC Portal
                            </Link>
                            <div className="flex flex-col gap-2">
                                {items.map((item: any) => {
                                    if (item.type === "dropdown" && item.children?.length > 0) {
                                        return (
                                            <div key={item.id} className="flex flex-col gap-2">
                                                <div className="font-medium text-muted-foreground px-2 py-1">
                                                    {item.label}
                                                </div>
                                                <div className="pl-4 flex flex-col gap-2 border-l ml-2">
                                                    {item.children.map((child: any) => (
                                                        <Link
                                                            key={child.id}
                                                            href={child.path || "#"}
                                                            className="block py-2 px-2 hover:bg-muted rounded-md text-sm"
                                                            onClick={() => setIsOpen(false)}
                                                        >
                                                            {child.label}
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    }
                                    const isDashboard = item.path === "/dashboard"
                                    const label = (isDashboard && !session) ? "Sign In" : item.label
                                    const path = (isDashboard && !session) ? "/auth/signin" : (item.path || "#")

                                    return (
                                        <Link
                                            key={item.id}
                                            href={path}
                                            className="block py-2 px-2 hover:bg-muted rounded-md font-medium"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            {label}
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>


                        {/* Mobile Auth Footer */}
                        <div className="mt-8 border-t pt-6">
                            {session ? (
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => signOut({ callbackUrl: "/" })}
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Sign Out
                                </Button>
                            ) : (
                                <Button
                                    className="w-full justify-start"
                                    asChild
                                    onClick={() => setIsOpen(false)}
                                >
                                    <Link href="/auth/signin">
                                        <LogIn className="mr-2 h-4 w-4" />
                                        Sign In
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </SheetContent>
                </Sheet>
            </div >
        </>
    )
}
