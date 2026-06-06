"use client"

import React, { useMemo } from "react"
import { Building2, CheckCircle2, AlertCircle, ChevronRight, ChevronDown } from "lucide-react"
import { SubaccountManager } from "@/components/admin/settings/subaccount-manager"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"

export function SubaccountHierarchy({ organizations, banks }: { organizations: any[], banks: any[] }) {
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

        return { nationals, tree, others }
    }, [organizations])

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

    const LgaNode = ({ lga }: { lga: any }) => {
        const [isOpen, setIsOpen] = React.useState(false)
        const hasChildren = lga.children && lga.children.length > 0
        
        return (
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <CollapsibleTrigger asChild>
                    <div className="cursor-pointer">
                        <OrgRow org={lga} level={1} hasChildren={hasChildren} isOpen={isOpen} onToggle={() => setIsOpen(!isOpen)} />
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

    const StateNode = ({ state }: { state: any }) => {
        const [isOpen, setIsOpen] = React.useState(false)
        const hasChildren = state.children && state.children.length > 0
        
        return (
            <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border rounded-xl mb-4 overflow-hidden shadow-sm">
                <CollapsibleTrigger asChild>
                    <div className="cursor-pointer bg-white">
                        <OrgRow org={state} level={0} hasChildren={hasChildren} isOpen={isOpen} onToggle={() => setIsOpen(!isOpen)} />
                    </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div className="bg-slate-50/30 border-t">
                        {state.children?.map((lga: any) => (
                            <LgaNode key={lga.id} lga={lga} />
                        ))}
                    </div>
                </CollapsibleContent>
            </Collapsible>
        )
    }

    return (
        <div className="space-y-6">
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
                    <StateNode key={state.id} state={state} />
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
