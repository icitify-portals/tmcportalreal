import Link from "next/link"
import { getNavigationItems } from "@/lib/actions/navigation"
import { NavbarClient } from "./navbar-client"

export async function Navbar() {
    const { data: navItems } = await getNavigationItems()

    // Default items if DB is empty
    const items = (navItems && navItems.length > 0) ? navItems : [
        { id: "1", label: "Home", path: "/", type: "link", order: 0 },
        { id: "2", label: "About Us", path: "/about", type: "link", order: 1 },
        { id: "3", label: "Adhkar Centres", path: "/adhkar", type: "link", order: 2 },
        { id: "4", label: "Teskiyyah Centres", path: "/teskiyah", type: "link", order: 3 },
        { id: "5", label: "Donate", path: "/donate", type: "link", order: 4 },
    ]

    return <NavbarClient items={items} />
}
