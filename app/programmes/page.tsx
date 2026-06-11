import { Suspense } from "react"
import { PublicNav } from "@/components/layout/public-nav"
import { Metadata } from "next"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Filter } from "lucide-react"

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: "Upcoming Programmes | TMC Portal",
    description: "Browse and register for upcoming TMC programmes and events across all jurisdictions.",
}

const NIGERIAN_STATES = [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", 
    "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe", 
    "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", 
    "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", 
    "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"
];
import { ProgrammeGrid } from "@/components/programmes/programme-grid"

export default async function ProgrammesPage({ searchParams }: { searchParams: Promise<{ level?: string, state?: string }> }) {
    const filters = await searchParams;

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
                    <form action="/programmes" method="GET" className="flex flex-col md:flex-row items-end gap-4 w-full">
                        <div className="w-full md:w-48">
                            <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block">Organization Level</label>
                            <Select name="level" defaultValue={filters.level || "ALL"}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="All Levels" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Levels</SelectItem>
                                    <SelectItem value="NATIONAL">National</SelectItem>
                                    <SelectItem value="STATE">State</SelectItem>
                                    <SelectItem value="LOCAL_GOVERNMENT">LGA</SelectItem>
                                    <SelectItem value="BRANCH">Branch</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="w-full md:w-56">
                            <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block">State / Jurisdiction</label>
                            <Select name="state" defaultValue={filters.state || "ALL"}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="All States" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All States</SelectItem>
                                    {NIGERIAN_STATES.map(state => (
                                        <SelectItem key={state} value={state}>{state}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex gap-2 w-full md:w-auto">
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
                        level={filters.level === "ALL" ? undefined : filters.level} 
                        state={filters.state === "ALL" ? undefined : filters.state} 
                    />
                </Suspense>
            </div>
        </div>
    )
}
