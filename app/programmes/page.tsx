import { Suspense } from "react"
export const dynamic = 'force-dynamic'
import { getProgrammes, getUserRegistrations } from "@/lib/actions/programmes"
import { RegisterForProgrammeDialog } from "@/components/programmes/register-dialog"
import { PublicNav } from "@/components/layout/public-nav"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, MapPinIcon, ClockIcon, UsersIcon, Filter, CheckCircle2 } from "lucide-react"
import { format } from "date-fns"
import { Metadata } from "next"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import Link from "next/link"

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

async function ProgrammeGrid({ level, state }: { level?: string, state?: string }) {
    const programmes = await getProgrammes({ status: 'APPROVED', level, state }) || []
    const userRegs = await getUserRegistrations()
    const registeredProgrammeIds = new Set(userRegs.map(r => r.programmeId))

    if (programmes.length === 0) {
        return (
            <div className="col-span-full flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-lg bg-gray-50/50">
                <div className="rounded-full bg-gray-100 p-3 mb-4">
                    <CalendarIcon className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold">No Programmes Found</h3>
                <p className="text-muted-foreground mt-1">Try adjusting your filters or check back later.</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programmes.map((p) => {
                const isPaid = p.paymentRequired && (parseFloat(p.amount || "0") > 0);

                return (
                    <Card key={p.id} className="flex flex-col h-full hover:shadow-md transition-shadow">
                        <CardHeader>
                            <div className="flex justify-between items-start mb-2">
                                <Badge variant={isPaid ? "default" : "secondary"} className="mb-2">
                                    {isPaid ? "Paid Event" : "Free Entry"}
                                </Badge>
                                <Badge variant="outline">{p.organization?.name || p.level}</Badge>
                            </div>
                            <CardTitle className="line-clamp-2">{p.title}</CardTitle>
                            <CardDescription className="flex items-center mt-1">
                                <MapPinIcon className="mr-1 h-3 w-3" />
                                {p.venue}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 space-y-4">
                            <p className="text-sm text-gray-600 line-clamp-3">
                                {p.description}
                            </p>

                            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                                <div className="flex items-center" suppressHydrationWarning>
                                    <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                                    <span>{format(new Date(p.startDate), "EEEE, MMMM do, yyyy")}</span>
                                </div>
                                {p.time && (
                                    <div className="flex items-center">
                                        <ClockIcon className="mr-2 h-4 w-4 text-primary" />
                                        <span>{p.time}</span>
                                    </div>
                                )}
                                <div className="flex items-center">
                                    <UsersIcon className="mr-2 h-4 w-4 text-primary" />
                                    <span>Target: {p.targetAudience}</span>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="pt-4 border-t bg-gray-50/50">
                            {registeredProgrammeIds.has(p.id) ? (
                                <Button className="w-full" variant="outline" disabled>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Already Registered
                                </Button>
                            ) : (
                                <RegisterForProgrammeDialog
                                    programmeId={p.id}
                                    programmeTitle={p.title}
                                    amount={parseFloat(p.amount || "0")}
                                />
                            )}
                        </CardFooter>
                    </Card>
                )
            })}
        </div>
    )
}

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
