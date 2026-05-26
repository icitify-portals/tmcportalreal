"use client"

import { useState, useEffect, useMemo } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface Organization {
    id: string
    name: string
    level: string
    parentId: string | null
}

export function FormJurisdictionSelector({
    organizations,
    value,
    onChange,
}: {
    organizations: Organization[]
    value: string
    onChange: (orgId: string) => void
}) {
    // Helper to find organization by ID
    const findOrg = (id: string) => organizations.find(o => o.id === id)

    // Initial state derived from value
    const getInitialState = () => {
        if (!value) return { level: "", stateId: "", lgaId: "", branchId: "" }
        
        const org = findOrg(value)
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

    const initialState = useMemo(getInitialState, [value, organizations])

    const [level, setLevel] = useState(initialState.level)
    const [stateId, setStateId] = useState(initialState.stateId)
    const [lgaId, setLgaId] = useState(initialState.lgaId)
    const [branchId, setBranchId] = useState(initialState.branchId)

    // Filtered lists
    const states = organizations.filter(o => o.level === 'STATE')
    const lgas = organizations.filter(o => o.level === 'LOCAL_GOVERNMENT' && o.parentId === stateId)
    const branches = organizations.filter(o => o.level === 'BRANCH' && o.parentId === lgaId)
    const nationalOrg = organizations.find(o => o.level === 'NATIONAL')

    // Initial setup if empty and National exists
    const [hasInitialized, setHasInitialized] = useState(false)
    useEffect(() => {
        if (!hasInitialized && !value && nationalOrg) {
            setLevel('NATIONAL')
            onChange(nationalOrg.id)
            setHasInitialized(true)
        }
    }, [value, nationalOrg, onChange, hasInitialized])

    const handleLevelChange = (val: string) => {
        setHasInitialized(true)
        setLevel(val)
        setStateId("")
        setLgaId("")
        setBranchId("")

        if (val === 'NATIONAL' && nationalOrg) {
            onChange(nationalOrg.id)
        } else {
            onChange("") // User needs to select down the tree
        }
    }

    const handleStateChange = (val: string) => {
        setStateId(val)
        setLgaId("")
        setBranchId("")
        
        if (level === 'STATE') {
            onChange(val)
        } else {
            onChange("")
        }
    }

    const handleLgaChange = (val: string) => {
        setLgaId(val)
        setBranchId("")
        
        if (level === 'LOCAL_GOVERNMENT') {
            onChange(val)
        } else {
            onChange("")
        }
    }

    const handleBranchChange = (val: string) => {
        setBranchId(val)
        onChange(val)
    }

    return (
        <div className="grid grid-cols-1 gap-4 p-4 border rounded-md bg-slate-50/50">
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
    )
}
