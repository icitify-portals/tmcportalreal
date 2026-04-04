export const dynamic = 'force-dynamic'

import { getServerSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { occasionRequests, members, programmes, memberProgrammes } from "@/lib/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Download, Award, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function MemberDocumentsPage() {
    const session = await getServerSession()
    if (!session?.user?.id) redirect("/login")

    // Fetch certificates from occasions
    const certificatesFound = await db.select()
        .from(occasionRequests)
        .where(and(
            eq(occasionRequests.userId, session.user.id),
            eq(occasionRequests.status, 'COMPLETED'),
            eq(occasionRequests.certificateNeeded, true)
        ))

    // Fetch certificates from programmes if they have been attended
    const attendedProgrammes = await db.select({
        programme: programmes,
        registration: memberProgrammes
    })
        .from(memberProgrammes)
        .innerJoin(programmes, eq(memberProgrammes.programmeId, programmes.id))
        .where(and(
            eq(memberProgrammes.userId, session.user.id),
            eq(memberProgrammes.status, 'ATTENDED'),
            eq(programmes.hasCertificate, true)
        ))

    const hasDocs = certificatesFound.length > 0 || attendedProgrammes.length > 0

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">My Documents</h1>
                    <p className="text-muted-foreground text-sm mt-1">Access your certificates and official documents.</p>
                </div>

                {!hasDocs ? (
                    <Card className="border-dashed py-12">
                        <CardContent className="flex flex-col items-center justify-center text-center space-y-3">
                            <FileText className="h-12 w-12 text-muted-foreground opacity-20" />
                            <h3 className="text-lg font-medium">No documents yet</h3>
                            <p className="text-muted-foreground max-w-sm">
                                Certificates will appear here once your requests are completed or after attending programs.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Occasion Certificates */}
                        {certificatesFound.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Award className="h-5 w-5 text-amber-500" />
                                        Occasion Certificates
                                    </CardTitle>
                                    <CardDescription>Certificates from your requested occasions.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {certificatesFound.map((cert) => (
                                        <div key={cert.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                                                    <ShieldCheck className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">Certificate #{cert.certificateNo || cert.id.slice(0, 8)}</p>
                                                    <p className="text-xs text-muted-foreground">Issued on {cert.updatedAt ? new Date(cert.updatedAt).toLocaleDateString() : "N/A"}</p>
                                                </div>
                                            </div>
                                            <Link href="/dashboard/member/occasions">
                                              <Button variant="ghost" size="sm">
                                                  <Download className="h-4 w-4 mr-2" /> Download
                                              </Button>
                                            </Link>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {/* Programme Certificates */}
                        {attendedProgrammes.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Award className="h-5 w-5 text-blue-500" />
                                        Programme Certificates
                                    </CardTitle>
                                    <CardDescription>Certificates from programmes you've attended.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {attendedProgrammes.map(({ programme, registration }) => (
                                        <div key={registration.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                                                    <ShieldCheck className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{programme.title}</p>
                                                    <p className="text-xs text-muted-foreground">Attended on {new Date(programme.startDate).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <Link href="/dashboard/member/programmes">
                                              <Button variant="ghost" size="sm">
                                                  <Download className="h-4 w-4 mr-2" /> Download
                                              </Button>
                                            </Link>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
