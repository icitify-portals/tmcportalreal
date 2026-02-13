"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"

const MenuBuilderDynamic = dynamic(
    () => import("./menu-builder").then((mod) => mod.MenuBuilder),
    {
        ssr: false,
        loading: () => <div className="h-64 border rounded-md bg-muted/10 animate-pulse" />,
    }
)

export function MenuBuilderClient({ initialData }: { initialData: any[] }) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <div className="h-64 border rounded-md bg-muted/10 animate-pulse" />
    }

    return <MenuBuilderDynamic initialData={initialData} />
}
