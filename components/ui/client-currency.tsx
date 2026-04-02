"use client"

import { useEffect, useState } from "react"

interface ClientCurrencyProps {
    amount: number | string
    currency?: string
    locale?: string
    className?: string
}

export function ClientCurrency({
    amount,
    currency = "NGN",
    locale = "en-NG",
    className
}: ClientCurrencyProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <span className={className}>...</span>
    }

    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount

    return (
        <span className={className}>
            {new Intl.NumberFormat(locale, {
                style: "currency",
                currency: currency,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            }).format(numAmount)}
        </span>
    )
}
