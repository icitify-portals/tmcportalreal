"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

interface Organization {
    id: string
    name: string
    level: string
    parentId: string | null
}

export function JurisdictionSelector({
    organizations,
    currentOrgId
}: {
    organizations: Organization[]
    currentOrgId?: string
}) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Helper to find organization by ID
    const findOrg = (id: string) => organizations.find(o => o.id === id)

    // Initial state derived from currentOrgId
    const getInitialState = () => {
        if (!currentOrgId) return { level: "", stateId: "", lgaId: "", branchId: "" }
        
        const org = findOrg(currentOrgId)
        if (!org) return { level: "", stateId: "", lgaId: "", branchId: "" }

        if (org.level === 'NATIONAL') return { level: 'NATIONAL', stateId: "", lgaId: "", branchId: "" }
        if (org.level === 'STATE') return { level: 'STATE', stateId: org.id, lgaId: "", branchId: "" }
        
        if (org.level === 'LOCAL_GOVERNMENT') {
            const state = org.parentId ? findOrg(org.parentId) : null
            return { 
                level: 'LOCAL_GOVERNMENT', 
                stateId: state?.id || "", 
                lgaId: org.id, 
                branchId: "" 
            }
        }
        
        if (org.level === 'BRANCH') {
            const lga = org.parentId ? findOrg(org.parentId) : null
            const state = lga?.parentId ? findOrg(lga.parentId) : null
            return { 
                level: 'BRANCH', 
                stateId: state?.id || "", 
                lgaId: lga?.id || "", 
                branchId: org.id 
            }
        }

        return { level: "", stateId: "", lgaId: "", branchId: "" }
    }

    const initialState = useMemo(getInitialState, [currentOrgId, organizations])

    const [level, setLevel] = useState(initialState.level)
    const [stateId, setStateId] = useState(initialState.stateId)
    const [lgaId, setLgaId] = useState(initialState.lgaId)
    const [branchId, setBranchId] = useState(initialState.branchId)

    // Synchronize UI if URL changes
    useEffect(() => {
        setLevel(initialState.level)
        setStateId(initialState.stateId)
        setLgaId(initialState.lgaId)
        setBranchId(initialState.branchId)
    }, [initialState])

    const updateQuery = (id: string | null) => {
        const params = new URLSearchParams(searchParams)
        if (id) {
            params.set("orgId", id)
        } else {
            params.delete("orgId")
        }
        router.push(`${pathname}?${params.toString()}`)
    }

    // Filtered lists
    const states = organizations.filter(o => o.level === 'STATE')
    const lgas = organizations.filter(o => o.level === 'LOCAL_GOVERNMENT' && o.parentId === stateId)
    const branches = organizations.filter(o => o.level === 'BRANCH' && o.parentId === lgaId)
    const nationalOrg = organizations.find(o => o.level === 'NATIONAL')

    const handleLevelChange = (val: string) => {
        setLevel(val)
        setStateId("")
        setLgaId("")
        setBranchId("")

        if (val === 'NATIONAL' && nationalOrg) {
            updateQuery(nationalOrg.id)
        } else {
            updateQuery(null) // Reset selection when level changes (except National)
        }
    }

    const handleStateChange = (val: string) => {
        setStateId(val)
        setLgaId("")
        setBranchId("")
        
        if (level === 'STATE') {
            updateQuery(val)
        } else {
            updateQuery(null)
        }
    }

    const handleLgaChange = (val: string) => {
        setLgaId(val)
        setBranchId("")
        
        if (level === 'LOCAL_GOVERNMENT') {
            updateQuery(val)
        } else {
            updateQuery(null)
        }
    }

    const handleBranchChange = (val: string) => {
        setBranchId(val)
        updateQuery(val)
    }

    return (
        <Card className="bg-slate-50/50 shadow-sm">
            <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <Label>Jurisdiction Level</Label>
                        <Select onValueChange={handleLevelChange} value={level}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Level" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="NATIONAL">National</SelectItem>
                                <SelectItem value="STATE">State</SelectItem>
                                <SelectItem value="LOCAL_GOVERNMENT">Local Government</SelectItem>
                                <SelectItem value="BRANCH">Branch</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {(level === 'STATE' || level === 'LOCAL_GOVERNMENT' || level === 'BRANCH') && (
                        <div className="space-y-2">
                            <Label>State</Label>
                            <Select onValueChange={handleStateChange} value={stateId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select State" />
                                </SelectTrigger>
                                <SelectContent>
                                    {states.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {(level === 'LOCAL_GOVERNMENT' || level === 'BRANCH') && (
                        <div className="space-y-2">
                            <Label>LGA</Label>
                            <Select 
                                onValueChange={handleLgaChange} 
                                value={lgaId}
                                disabled={!stateId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select LGA" />
                                </SelectTrigger>
                                <SelectContent>
                                    {lgas.map(l => (
                                        <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {level === 'BRANCH' && (
                        <div className="space-y-2">
                            <Label>Branch</Label>
                            <Select 
                                onValueChange={handleBranchChange} 
                                value={branchId}
                                disabled={!lgaId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Branch" />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches.map(b => (
                                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
                
                {!currentOrgId && level && (
                    <p className="text-xs text-muted-foreground mt-4 italic">
                        Please complete the selection to manage fees.
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
