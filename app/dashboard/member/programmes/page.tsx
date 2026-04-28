import { Suspense } from "react"
import { getUserRegistrations } from "@/lib/actions/programmes"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Printer, CreditCard } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CertificateDownloadButton } from "@/components/programme/certificate-download-button"
import { format } from "date-fns"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ClientDate } from "@/components/ui/client-date"

export const dynamic = "force-dynamic"

async function MyProgrammesList() {
    const registrations = await getUserRegistrations()

    if (registrations.length === 0) {
        return (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">You haven't registered for any programmes yet.</p>
            </div>
        )
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {registrations.map(({ programme, ...reg }) => (
                <Card key={reg.id} className="flex flex-col">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <CardTitle className="line-clamp-2">{programme?.title}</CardTitle>
                            <Badge variant={
                                reg.status === 'ATTENDED' ? 'default' :
                                    reg.status === 'REGISTERED' ? 'secondary' : 'outline'
                            }>
                                {reg.status}
                            </Badge>
                        </div>
                        <CardDescription>{programme?.level} Programme</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                        {programme && (
                            <>
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    <ClientDate date={programme.startDate} formatString="PPP" />
                                </div>
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <MapPin className="mr-2 h-4 w-4" />
                                    {programme.venue}
                                </div>
                            </>
                        )}
                    </CardContent>
                    <CardFooter className="flex-col gap-2">
                        {(reg.status === 'REGISTERED' || reg.status === 'PAID') && (
                            <Button variant="outline" size="sm" asChild className="w-full border-green-200 text-green-700 hover:bg-green-50">
                                <Link href={`/programmes/registrations/${reg.id}/slip`} target="_blank">
                                    <Printer className="mr-2 h-4 w-4" /> Print Access Slip
                                </Link>
                            </Button>
                        )}
                        
                        {reg.status === 'PENDING_PAYMENT' && (
                            <Button size="sm" className="w-full bg-orange-600 hover:bg-orange-700" asChild>
                                <Link href={`/programmes/registrations/${reg.id}/verify`}>
                                    <CreditCard className="mr-2 h-4 w-4" /> Pay Now
                                </Link>
                            </Button>
                        )}

                        {reg.status === 'ATTENDED' && programme?.hasCertificate ? (
                            <CertificateDownloadButton
                                userName={reg.name}
                                programmeTitle={programme.title}
                                date={programme.startDate}
                                programmeId={programme.id}
                            />
                        ) : reg.status === 'ATTENDED' ? (
                            <p className="text-xs text-muted-foreground italic">No certificate involved</p>
                        ) : null}
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}


export default function MyProgrammesPage() {
    return (
        <DashboardLayout>
            <div className="flex-1 space-y-4">
                <h2 className="text-3xl font-bold tracking-tight">My Programmes</h2>
                <Suspense fallback={<div>Loading...</div>}>
                    <MyProgrammesList />
                </Suspense>
            </div>
        </DashboardLayout>
    )
}
