import { Suspense } from "react"
import { getUserRegistrations } from "@/lib/actions/programmes"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin } from "lucide-react"
import { CertificateDownloadButton } from "@/components/programme/certificate-download-button"
import { format } from "date-fns"

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
                                    {format(new Date(programme.startDate), "PPP")}
                                </div>
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <MapPin className="mr-2 h-4 w-4" />
                                    {programme.venue}
                                </div>
                            </>
                        )}
                    </CardContent>
                    <CardFooter>
                        {reg.status === 'ATTENDED' && programme?.hasCertificate ? (
                            <CertificateDownloadButton
                                userName={reg.name}
                                programmeTitle={programme.title}
                                date={programme.startDate}
                                programmeId={programme.id}
                            />
                        ) : (
                            <p className="text-xs text-muted-foreground italic">
                                {reg.status === 'ATTENDED' ? "No certificate involved" : "Certificate available after attendance"}
                            </p>
                        )}
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}

export default function MyProgrammesPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <h2 className="text-3xl font-bold tracking-tight">My Programmes</h2>
            <Suspense fallback={<div>Loading...</div>}>
                <MyProgrammesList />
            </Suspense>
        </div>
    )
}
