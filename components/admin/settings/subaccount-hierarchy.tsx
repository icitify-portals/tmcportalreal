"use client"

import React, { useMemo, useState } from "react"
import { Building2, CheckCircle2, AlertCircle, ChevronRight, ChevronDown, Search } from "lucide-react"
import { SubaccountManager } from "@/components/admin/settings/subaccount-manager"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function SubaccountHierarchy({ organizations, banks }: { organizations: any[], banks: any[] }) {
    const [searchQuery, setSearchQuery] = useState("")

    // Group and sort
    const hierarchy = useMemo(() => {
        const sortedOrgs = [...organizations].sort((a, b) => (a.name || "").localeCompare(b.name || ""))
        
        const states = sortedOrgs.filter(o => o.level === 'STATE')
        const lgas = sortedOrgs.filter(o => o.level === 'LOCAL_GOVERNMENT')
        const branches = sortedOrgs.filter(o => o.level === 'BRANCH')
        const nationals = sortedOrgs.filter(o => o.level === 'NATIONAL')

        // Let's create an "Other/Uncategorized" array for those that don't fit
        const categorizedIds = new Set<string>()

        const tree = states.map(state => {
            categorizedIds.add(state.id)
            const stateLgas = lgas.filter(lga => lga.parentId === state.id).map(lga => {
                categorizedIds.add(lga.id)
                const lgaBranches = branches.filter(branch => branch.parentId === lga.id).map(branch => {
                    categorizedIds.add(branch.id)
                    return branch
                })
                return { ...lga, children: lgaBranches }
            })
            return { ...state, children: stateLgas }
        })

        const others = sortedOrgs.filter(o => !categorizedIds.has(o.id) && o.level !== 'NATIONAL')

        let filteredNationals = nationals;
        let filteredOthers = others;
        let filteredTree = tree;

        if (searchQuery.trim()) {
            const lowerQuery = searchQuery.toLowerCase();
            
            filteredNationals = nationals.filter(n => n.name?.toLowerCase().includes(lowerQuery) || n.paystackSubaccountCode?.toLowerCase().includes(lowerQuery));
            filteredOthers = others.filter(o => o.name?.toLowerCase().includes(lowerQuery) || o.paystackSubaccountCode?.toLowerCase().includes(lowerQuery));
            
            filteredTree = tree.map(state => {
                const stateMatch = state.name?.toLowerCase().includes(lowerQuery) || state.paystackSubaccountCode?.toLowerCase().includes(lowerQuery);
                
                const filteredLgas = state.children.map((lga: any) => {
                    const lgaMatch = lga.name?.toLowerCase().includes(lowerQuery) || lga.paystackSubaccountCode?.toLowerCase().includes(lowerQuery);
                    
                    const filteredBranches = lga.children.filter((branch: any) => 
                        branch.name?.toLowerCase().includes(lowerQuery) || branch.paystackSubaccountCode?.toLowerCase().includes(lowerQuery)
                    );

                    if (stateMatch || lgaMatch || filteredBranches.length > 0) {
                        return {
                            ...lga,
                            children: (stateMatch || lgaMatch) ? lga.children : filteredBranches
                        };
                    }
                    return null;
                }).filter(Boolean);

                if (stateMatch || filteredLgas.length > 0) {
                    return {
                        ...state,
                        children: stateMatch ? state.children : filteredLgas
                    }
                }
                return null;
            }).filter(Boolean);
        }

        return { nationals: filteredNationals, tree: filteredTree, others: filteredOthers }
    }, [organizations, searchQuery])

    const OrgRow = ({ org, level = 0, hasChildren = false, isOpen = false, onToggle = () => {} }: any) => (
        <div className={`flex flex-col md:flex-row md:items-center justify-between p-4 border-b hover:bg-slate-50 transition-colors gap-4 ${level === 1 ? 'bg-slate-50/50' : ''} ${level === 2 ? 'bg-slate-100/30' : ''}`}>
            <div className="flex items-center gap-4" style={{ paddingLeft: `${level * 1.5}rem` }}>
                {hasChildren ? (
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={onToggle}>
                        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                ) : (
                    <div className="h-6 w-6 shrink-0" />
                )}
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 shrink-0">
                    <Building2 className="h-4 w-4" />
                </div>
                <div>
                    <h3 className="font-bold flex items-center gap-2 text-sm md:text-base text-slate-900">
                        {org.name}
                        <span className="text-[9px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-600 uppercase tracking-tighter shadow-sm font-normal">
                            {org.level}
                        </span>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {org.paystackSubaccountCode ? (
                            <span className="text-green-600 flex items-center gap-1 font-medium">
                                <CheckCircle2 className="h-3 w-3" />
                                Linked: {org.paystackSubaccountCode}
                            </span>
                        ) : (
                            <span className="text-amber-600 flex items-center gap-1 font-medium">
                                <AlertCircle className="h-3 w-3" />
                                Not Integrated
                            </span>
                        )}
                    </p>
                </div>
            </div>
            <div className="pl-[2.5rem] md:pl-0">
                <SubaccountManager organization={org} banks={banks} />
            </div>
        </div>
    )

    const BranchNode = ({ branch }: { branch: any }) => {
        return <OrgRow org={branch} level={2} />
    }

    const LgaNode = ({ lga, forceOpen }: { lga: any, forceOpen: boolean }) => {
        const [isOpen, setIsOpen] = React.useState(false)
        const effectivelyOpen = forceOpen || isOpen;
        const hasChildren = lga.children && lga.children.length > 0
        
        return (
            <Collapsible open={effectivelyOpen} onOpenChange={(open) => setIsOpen(open)}>
                <CollapsibleTrigger asChild>
                    <div className="cursor-pointer">
                        <OrgRow org={lga} level={1} hasChildren={hasChildren} isOpen={effectivelyOpen} onToggle={() => setIsOpen(!isOpen)} />
                    </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div className="border-l-2 border-slate-100 ml-6">
                        {lga.children?.map((branch: any) => (
                            <BranchNode key={branch.id} branch={branch} />
                        ))}
                    </div>
                </CollapsibleContent>
            </Collapsible>
        )
    }

    const StateNode = ({ state, forceOpen }: { state: any, forceOpen: boolean }) => {
        const [isOpen, setIsOpen] = React.useState(false)
        const effectivelyOpen = forceOpen || isOpen;
        const hasChildren = state.children && state.children.length > 0
        
        return (
            <Collapsible open={effectivelyOpen} onOpenChange={(open) => setIsOpen(open)} className="border rounded-xl mb-4 overflow-hidden shadow-sm">
                <CollapsibleTrigger asChild>
                    <div className="cursor-pointer bg-white">
                        <OrgRow org={state} level={0} hasChildren={hasChildren} isOpen={effectivelyOpen} onToggle={() => setIsOpen(!isOpen)} />
                    </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div className="bg-slate-50/30 border-t">
                        {state.children?.map((lga: any) => (
                            <LgaNode key={lga.id} lga={lga} forceOpen={forceOpen} />
                        ))}
                    </div>
                </CollapsibleContent>
            </Collapsible>
        )
    }

    return (
        <div className="space-y-6">
            <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search by state, LGA, branch or subaccount code..." 
                    className="pl-10 bg-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {hierarchy.nationals.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold tracking-tight">National Offices</h2>
                    <div className="border rounded-xl overflow-hidden shadow-sm bg-white">
                        {hierarchy.nationals.map(nat => (
                            <OrgRow key={nat.id} org={nat} level={0} />
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-4">
                <h2 className="text-xl font-bold tracking-tight">States, LGAs, and Branches</h2>
                {hierarchy.tree.map((state) => (
                    <StateNode key={state.id} state={state} forceOpen={searchQuery.trim().length > 0} />
                ))}
            </div>

            {hierarchy.others.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold tracking-tight text-slate-500">Uncategorized / Unlinked Parent</h2>
                    <div className="border rounded-xl overflow-hidden shadow-sm bg-white opacity-80">
                        {hierarchy.others.map(other => (
                            <OrgRow key={other.id} org={other} level={0} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
