"use client"

import { useState, useEffect } from "react"
import { OfficialCard } from "./official-card"
import { Building2, MapPin, ChevronRight, Loader2, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { NationalNode, StateNode, LgaNode, BranchNode } from "@/lib/org-helper"

interface ClientAboutContentProps {
    tree: NationalNode[]
}

type Official = {
    id: string
    position: string
    positionLevel: string
    userName: string
    image: string | null
    bio: string | null
    orgName: string
}

export function ClientAboutContent({ tree }: ClientAboutContentProps) {
    const [selectedState, setSelectedState] = useState<StateNode | null>(null)
    const [selectedLga, setSelectedLga] = useState<LgaNode | null>(null)
    const [selectedBranch, setSelectedBranch] = useState<BranchNode | null>(null)
    
    const [officials, setOfficials] = useState<Official[]>([])
    const [loading, setLoading] = useState(true)
    const [activeLevel, setActiveLevel] = useState<"NATIONAL" | "STATE" | "LOCAL_GOVERNMENT" | "BRANCH">("NATIONAL")

    const nationalOrgId = tree[0]?.id

    // Fetch officials whenever selection changes
    useEffect(() => {
        async function fetchOfficials() {
            setLoading(true)
            try {
                let url = "/api/officials/public?"
                if (selectedBranch) {
                    url += `organizationId=${selectedBranch.id}`
                    setActiveLevel("BRANCH")
                } else if (selectedLga) {
                    url += `organizationId=${selectedLga.id}`
                    setActiveLevel("LOCAL_GOVERNMENT")
                } else if (selectedState) {
                    url += `organizationId=${selectedState.id}`
                    setActiveLevel("STATE")
                } else {
                    url += `organizationId=${nationalOrgId}`
                    setActiveLevel("NATIONAL")
                }

                const res = await fetch(url)
                const data = await res.json()
                setOfficials(Array.isArray(data) ? data : [])
            } catch (err) {
                console.error("Failed to fetch officials", err)
            } finally {
                setLoading(false)
            }
        }

        fetchOfficials()
    }, [selectedState, selectedLga, selectedBranch, nationalOrgId])

    const handleStateChange = (state: StateNode | null) => {
        setSelectedState(state)
        setSelectedLga(null)
        setSelectedBranch(null)
    }

    const handleLgaChange = (lga: LgaNode | null) => {
        setSelectedLga(lga)
        setSelectedBranch(null)
    }

    return (
        <div className="container mx-auto px-4 py-16 max-w-7xl">
            {/* ── Hierarchy Selector ─────────────────────────────────────── */}
            <div className="mb-20 bg-white p-6 rounded-3xl shadow-xl shadow-green-900/5 border border-gray-100 ring-1 ring-black/5">
                <div className="flex flex-col md:flex-row items-center gap-6 justify-center">
                    
                    {/* Level: National (Reset) */}
                    <button 
                        onClick={() => { handleStateChange(null) }}
                        className={cn(
                            "flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all",
                            activeLevel === "NATIONAL" 
                                ? "bg-green-700 text-white shadow-lg shadow-green-200" 
                                : "text-gray-500 hover:bg-gray-50 bg-gray-50/50"
                        )}
                    >
                        <Building2 className="h-4 w-4" />
                        NATIONAL
                    </button>

                    <ChevronRight className="h-4 w-4 text-gray-300 hidden md:block" />

                    {/* Level: State */}
                    <select 
                        className={cn(
                            "px-4 py-3 rounded-2xl text-sm font-bold outline-none border transition-all cursor-pointer min-w-[180px]",
                            selectedState 
                                ? "bg-green-50 border-green-200 text-green-700" 
                                : "bg-gray-50 border-gray-100 text-gray-500 hover:border-gray-300"
                        )}
                        value={selectedState?.id || ""}
                        onChange={(e) => {
                            const state = tree[0].states.find(s => s.id === e.target.value) || null
                            handleStateChange(state)
                        }}
                    >
                        <option value="">SELECT STATE</option>
                        {tree[0]?.states.map(s => (
                            <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>
                        ))}
                    </select>

                    {selectedState && (
                        <>
                            <ChevronRight className="h-4 w-4 text-gray-300 hidden md:block" />
                            <select 
                                className={cn(
                                    "px-4 py-3 rounded-2xl text-sm font-bold outline-none border transition-all cursor-pointer min-w-[180px]",
                                    selectedLga 
                                        ? "bg-green-50 border-green-200 text-green-700" 
                                        : "bg-gray-50 border-gray-100 text-gray-500 hover:border-gray-300"
                                )}
                                value={selectedLga?.id || ""}
                                onChange={(e) => {
                                    const lga = selectedState.lgas.find(l => l.id === e.target.value) || null
                                    handleLgaChange(lga)
                                }}
                            >
                                <option value="">SELECT LGA</option>
                                {selectedState.lgas.map(l => (
                                    <option key={l.id} value={l.id}>{l.name.toUpperCase()}</option>
                                ))}
                            </select>
                        </>
                    )}

                    {selectedLga && (
                        <>
                            <ChevronRight className="h-4 w-4 text-gray-300 hidden md:block" />
                            <select 
                                className={cn(
                                    "px-4 py-3 rounded-2xl text-sm font-bold outline-none border transition-all cursor-pointer min-w-[180px]",
                                    selectedBranch 
                                        ? "bg-green-50 border-green-200 text-green-700" 
                                        : "bg-gray-50 border-gray-100 text-gray-500 hover:border-gray-300"
                                )}
                                value={selectedBranch?.id || ""}
                                onChange={(e) => {
                                    const branch = selectedLga.branches.find(b => b.id === e.target.value) || null
                                    setSelectedBranch(branch)
                                }}
                            >
                                <option value="">SELECT BRANCH</option>
                                {selectedLga.branches.map(b => (
                                    <option key={b.id} value={b.id}>{b.name.toUpperCase()}</option>
                                ))}
                            </select>
                        </>
                    )}
                </div>
            </div>

            {/* ── Title Section ────────────────────────────────────────── */}
            <div className="mb-12 flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        {selectedBranch ? selectedBranch.name : 
                         selectedLga ? selectedLga.name : 
                         selectedState ? selectedState.name : "National Leadership"}
                    </h2>
                    <p className="text-green-600 font-bold tracking-widest text-xs mt-2 uppercase">
                        Current Administrative Officers
                    </p>
                </div>
                <div className="hidden sm:flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-xl text-sm font-bold border border-green-100">
                    <Users className="h-4 w-4" />
                    {officials.length} Active Profiles
                </div>
            </div>

            {/* ── Officials Grid ───────────────────────────────────────── */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 text-gray-400">
                    <Loader2 className="h-10 w-10 animate-spin mb-4 text-green-600" />
                    <p className="text-sm font-medium">Fetching officials...</p>
                </div>
            ) : officials.length === 0 ? (
                <div className="bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 p-20 text-center">
                    <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900">No officials recorded</h3>
                    <p className="text-gray-500 max-w-sm mx-auto mt-2">
                        Leadership information for this jurisdiction hasn't been uploaded yet.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {officials.map(official => (
                        <OfficialCard 
                            key={official.id}
                            name={official.userName}
                            position={official.position}
                            image={official.image}
                            bio={official.bio}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
