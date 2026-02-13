import { Suspense } from "react"
export const dynamic = 'force-dynamic'
import { getProgrammes } from "@/lib/actions/programmes"
import { RegisterForProgrammeDialog } from "@/components/programmes/register-dialog"
import { PublicNav } from "@/components/layout/public-nav"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, MapPinIcon, ClockIcon, UsersIcon } from "lucide-react"
import { format } from "date-fns"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Programmes & Events | TMC Portal",
    description: "Browse and register for upcoming TMC programmes and events.",
}

async function ProgrammeGrid() {
    const programmes = await getProgrammes({ status: 'APPROVED' }) || []

    if (programmes.length === 0) {
        return (
            <div className="col-span-full flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-lg bg-gray-50/50">
                <div className="rounded-full bg-gray-100 p-3 mb-4">
                    <CalendarIcon className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold">No Upcoming Programmes</h3>
                <p className="text-muted-foreground mt-1">Check back later for new events and activities.</p>
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
                                <Badge variant="outline">{p.targetAudience}</Badge>
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
                                    <span>Open to: {p.targetAudience}</span>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="pt-4 border-t bg-gray-50/50">
                            <RegisterForProgrammeDialog
                                programmeId={p.id}
                                programmeTitle={p.title}
                                amount={parseFloat(p.amount || "0")}
                            />
                        </CardFooter>
                    </Card>
                )
            })}
        </div>
    )
}

export default function ProgrammesPage() {
    return (
        <div className="min-h-screen bg-background">
            <PublicNav />
            <div className="container mx-auto py-8 px-4 max-w-7xl">
                <div className="mb-8 space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">Upcoming Programmes</h1>
                    <p className="text-muted-foreground text-lg">
                        Discover and participate in events organized by TMC across various levels.
                    </p>
                </div>

                <Suspense fallback={<div className="grid grid-cols-1 md:grid-cols-3 gap-6">{[1, 2, 3].map(i => <div key={i} className="h-64 bg-gray-100 rounded-lg animate-pulse" />)}</div>}>
                    <ProgrammeGrid />
                </Suspense>
            </div>
        </div>
    )
}
