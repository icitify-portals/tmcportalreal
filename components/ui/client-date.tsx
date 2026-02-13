"use client"

import { useEffect, useState } from "react"
import { format, formatDistanceToNow } from "date-fns"

interface ClientDateProps {
    date: Date | string | number
    mode?: "relative" | "absolute"
    formatString?: string
    className?: string
    addSuffix?: boolean
}

export function ClientDate({
    date,
    mode = "absolute",
    formatString = "PP",
    className,
    addSuffix = true
}: ClientDateProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const dateObj = new Date(date)

    if (!mounted) {
        // Render a placeholder or nothing during SSR to avoid mismatch
        // Rendering nothing is safest for avoiding hydration errors of "content mismatch"
        // But for "attribute mismatch", this component returns a span or null.
        return <span className={className}>...</span>
    }

    if (mode === "relative") {
        return (
            <span className={className}>
                {formatDistanceToNow(dateObj, { addSuffix })}
            </span>
        )
    }

    return (
        <span className={className}>
            {format(dateObj, formatString)}
        </span>
    )
}
