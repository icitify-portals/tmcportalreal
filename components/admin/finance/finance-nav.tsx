"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

interface FinanceNavProps {
    organizationId: string
}

export function FinanceNav({ organizationId }: FinanceNavProps) {
    const pathname = usePathname()

    const items = [
        {
            title: "Home",
            href: "/",
        },
        {
            title: "Dashboard",
            href: "/dashboard",
        },
        {
            title: "Budgets",
            href: "/dashboard/admin/finance/budgets",
        },
        {
            title: "Fund Requests",
            href: "/dashboard/admin/finance/requests",
        },
        {
            title: "Transactions",
            href: "/dashboard/admin/finance/transactions",
        },
        {
            title: "Reports",
            href: "/dashboard/admin/finance/reports",
        },
        {
            title: "Fees (Levies)",
            href: "/dashboard/admin/finance/fees",
        },
    ]

    return (
        <nav className="flex space-x-2 lg:space-x-4 mb-4 overflow-x-auto pb-2">
            {items.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                        buttonVariants({ variant: "ghost" }),
                        pathname === item.href
                            ? "bg-muted hover:bg-muted"
                            : "hover:bg-transparent hover:underline",
                        "justify-start whitespace-nowrap"
                    )}
                >
                    {item.title}
                </Link>
            ))}
        </nav>
    )
}
