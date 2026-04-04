"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function OrganizationSelector({ 
    currentOrgId, 
    organizations 
}: { 
    currentOrgId: string, 
    organizations: { id: string, name: string, level?: string }[] 
}) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const onSelect = (value: string) => {
        const params = new URLSearchParams(searchParams)
        if (value === "all") {
            params.delete("orgId")
        } else {
            params.set("orgId", value)
        }
        router.push(`${pathname}?${params.toString()}`)
    }

    return (
        <Select onValueChange={onSelect} defaultValue={currentOrgId || "all"}>
            <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Filter by Organization" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Organizations</SelectItem>
                {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                        {org.name} {org.level ? `(${org.level})` : ""}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
