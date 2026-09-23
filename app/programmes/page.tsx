import { Suspense } from "react"
import { PublicNav } from "@/components/layout/public-nav"
import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Filter, Search } from "lucide-react"

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: "Upcoming Programmes | TMC Portal",
    description: "Browse and register for upcoming TMC programmes and events across all jurisdictions.",
}

const NIGERIAN_STATES = [
    "Lagos", "Oyo", "Osun", "Niger", "Kwara", "Edo", "Ekiti", "FCT", "Ogun", "Ondo"
];
import { ProgrammeGrid } from "@/components/programmes/programme-grid"

export default async function ProgrammesPage({ searchParams }: { searchParams: Promise<{ level?: string, state?: string, q?: string }> }) {
    const filters = await searchParams;
    const query = (filters.q || "").trim()
    const level = filters.level && filters.level !== "ALL" ? filters.level : undefined
    const state = filters.state && filters.state !== "ALL" ? filters.state : undefined

    return (
        <div className="min-h-screen bg-background pb-12">
            <PublicNav />
            
            {/* Hero Section */}
            <div className="bg-green-700 text-white py-12 mb-8">
                <div className="container mx-auto px-4 max-w-7xl">
                    <h1 className="text-3xl font-bold tracking-tight lg:text-5xl mb-4">Upcoming Programmes</h1>
                    <p className="text-green-50 text-lg max-w-2xl">
                        Explore activities and events happening across our National, State, and Local jurisdictions.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 max-w-7xl">
                {/* Filter Bar */}
                <div className="bg-white border rounded-xl p-4 mb-8 shadow-sm">
                    <form action="/programmes" method="GET" className="grid grid-cols-1 md:grid-cols-[1fr_11rem_13rem_11rem] items-end gap-4 w-full">
                        <div>
                            <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block">Search programmes</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    type="search"
                                    name="q"
                                    defaultValue={query}
                                    placeholder="Search by title, venue or host (e.g. Islamic Training)"
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <div className="w-full md:w-48">
                            <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block">Organization Level</label>
                            <select
                                name="level"
                                defaultValue={filters.level || "ALL"}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring"
                            >
                                <option value="ALL">All Levels</option>
                                <option value="NATIONAL">National</option>
                                <option value="STATE">State</option>
                                <option value="LOCAL_GOVERNMENT">LGA</option>
                                <option value="BRANCH">Branch</option>
                            </select>
                        </div>

                        <div className="w-full md:w-56">
                            <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block">State / Jurisdiction</label>
                            <select
                                name="state"
                                defaultValue={filters.state || "ALL"}
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring"
                            >
                                <option value="ALL">All States</option>
                                {NIGERIAN_STATES.map(state => (
                                    <option key={state} value={state}>{state}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-2 w-full md:w-auto justify-end">
                            <Button asChild variant="outline" className="flex-1 md:flex-none">
                                <Link href="/programmes">
                                    Clear
                                </Link>
                            </Button>
                            <Button type="submit" className="flex-1 md:flex-none bg-green-700 hover:bg-green-800">
                                <Filter className="mr-2 h-4 w-4" />
                                Filter
                            </Button>
                        </div>
                    </form>
                </div>

                <Suspense key={JSON.stringify(filters)} fallback={
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-80 bg-gray-100 rounded-lg animate-pulse border" />
                        ))}
                    </div>
                }>
                    <ProgrammeGrid 
                        level={level} 
                        state={state} 
                        query={query || undefined} 
                    />
                </Suspense>
            </div>
        </div>
    )
}
