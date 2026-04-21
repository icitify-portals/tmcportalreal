export const dynamic = 'force-dynamic'

import { getServerSession } from "@/lib/session"
import { db } from "@/lib/db"
import { officials, users, organizations } from "@/lib/db/schema"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
    UserCheck, Mail, Phone, Building2, 
    Calendar, MapPin, ArrowLeft, Globe, 
    ShieldCheck, Clock, FileText 
} from "lucide-react"
import Link from "next/link"
import { eq } from "drizzle-orm"
import { format } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { notFound } from "next/navigation"

export default async function OfficialBioPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession()
    const { id } = await params

    // Fetch official with associated data
    const official = await db.query.officials.findFirst({
        where: eq(officials.id, id),
        with: {
            organization: true,
            user: true
        }
    })

    if (!official) {
        notFound()
    }

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header Actions */}
                <div className="flex items-center justify-between">
                    <Link href="/dashboard/admin/officials">
                        <Button variant="ghost" size="sm" className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Officials
                        </Button>
                    </Link>
                    <Badge variant={official.isActive ? "default" : "secondary"} className="px-3 py-1">
                        {official.isActive ? "Active Official" : "Inactive / Term Ended"}
                    </Badge>
                </div>

                {/* Profile Header Card */}
                <div className="relative overflow-hidden rounded-2xl border bg-card shadow-sm">
                    <div className="absolute top-0 left-0 w-full h-32 bg-primary/10" />
                    <div className="relative pt-16 pb-8 px-8 flex flex-col md:flex-row items-center md:items-end gap-6">
                        <Avatar className="h-32 w-32 border-4 border-background shadow-xl rounded-2xl">
                            <AvatarImage src={official.image || (official.user as any).image} />
                            <AvatarFallback className="text-4xl">{(official.user as any).name?.[0]}</AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 text-center md:text-left space-y-2">
                            <div>
                                <h1 className="text-3xl font-bold">{(official.user as any).name}</h1>
                                <p className="text-primary font-semibold uppercase tracking-wider text-sm">
                                    {official.position}
                                </p>
                            </div>
                            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-muted-foreground text-sm">
                                <span className="flex items-center gap-1.5">
                                    <Building2 className="h-4 w-4" />
                                    {official.organization.name}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="h-4 w-4" />
                                    {official.organization.level} Level
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button variant="outline" size="icon" className="rounded-full">
                                <Mail className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" className="rounded-full">
                                <Phone className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Sidebar Info */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-primary" />
                                    Appointment Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <div className="space-y-1">
                                    <p className="text-muted-foreground">Position Level</p>
                                    <p className="font-medium">{official.positionLevel}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-muted-foreground">Date Appointed</p>
                                    <p className="font-medium">
                                        {official.termStart ? format(new Date(official.termStart), 'PPP') : 'N/A'}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-muted-foreground">Current Term</p>
                                    <p className="font-medium">
                                        {official.termStart ? format(new Date(official.termStart), 'yyyy') : ''} - {official.termEnd ? format(new Date(official.termEnd), 'yyyy') : 'Present'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-primary" />
                                    Last Activity
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm">
                                <p className="text-muted-foreground italic">
                                    Last profile update on {format(new Date(official.updatedAt || new Date()), 'PP')}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content (Bio) */}
                    <div className="md:col-span-2 space-y-6">
                        <Card className="min-h-[400px]">
                            <CardHeader className="border-b bg-muted/20">
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-primary" />
                                    Biography
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-8">
                                {official.bio ? (
                                    <div className="prose prose-sm dark:prose-invert max-w-none">
                                        {official.bio.split('\n').map((para, i) => (
                                            <p key={i} className="mb-4 leading-relaxed text-base">
                                                {para}
                                            </p>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-48 text-muted-foreground italic">
                                        <div className="bg-muted p-4 rounded-full mb-4">
                                            <UserCheck className="h-8 w-8 opacity-20" />
                                        </div>
                                        No biography has been provided for this official yet.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
