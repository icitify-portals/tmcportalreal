"use client"

import React from 'react'
import { useRouter } from "next/navigation"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export function JurisdictionFilter({
    jurisdictions,
    currentId
}: {
    jurisdictions: any[],
    currentId?: string
}) {
    const router = useRouter()

    return (
        <Select
            value={currentId || "all"}
            onValueChange={(val) => {
                if (val === "all") {
                    router.push("/dashboard/admin/finance/analytics")
                } else {
                    router.push(`/dashboard/admin/finance/analytics?orgId=${val}`)
                }
            }}
        >
            <SelectTrigger>
                <SelectValue placeholder="Select Jurisdiction" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Consolidated View</SelectItem>
                {jurisdictions.map((j) => (
                    <SelectItem key={j.id} value={j.id}>
                        {j.name} ({j.level})
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
