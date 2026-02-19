import Link from "next/link"
import { getNavigationItems } from "@/lib/actions/navigation"
import { NavbarClient } from "./navbar-client"

export async function Navbar() {
    const { data: navItems } = await getNavigationItems()

    // Default items if DB is empty
    const items = (navItems && navItems.length > 0) ? navItems : [
        { id: "0", label: "Dashboard", path: "/dashboard", type: "link", order: -1 },
        { id: "1", label: "Home", path: "/", type: "link", order: 0 },
        { id: "2", label: "Constitution", path: "/constitution", type: "link", order: 1 },
        { id: "3", label: "Adhkar Centres", path: "/adhkar", type: "link", order: 2 },
        { id: "4", label: "Teskiyah Centres", path: "/teskiyah", type: "link", order: 3 },
        { id: "5", label: "Our Programmes", path: "/our-programmes", type: "link", order: 4 },
        { id: "6", label: "Our Organs", path: "/organs", type: "link", order: 5 },
        { id: "7", label: "Donate", path: "/donate", type: "link", order: 6 },
        { id: "8", label: "Media Library", path: "/programmes/special", type: "link", order: 7 },
    ]

    return <NavbarClient items={items} />
}
