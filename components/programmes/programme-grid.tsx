import { getProgrammes, getUserRegistrations } from "@/lib/actions/programmes"
import { RegisterForProgrammeDialog } from "@/components/programmes/register-dialog"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, MapPinIcon, ClockIcon, UsersIcon, CheckCircle2, CreditCard, XCircle, Video } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export async function ProgrammeGrid({ level, state, organizationId, organizationCode }: { level?: string, state?: string, organizationId?: string, organizationCode?: string }) {
    const programmes = await getProgrammes({ status: 'APPROVED', level, state, organizationId, organizationCode }) || []
    const userRegs = await getUserRegistrations()
    const registeredProgrammesMap = new Map(userRegs.map(r => [r.programmeId, r]))

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
            {programmes.map((p: any) => {
                const isPaid = p.paymentRequired && (parseFloat(p.amount || "0") > 0);
                const isEarlyBird = p.earlyBirdAmount && p.earlyBirdDeadline && new Date() <= new Date(p.earlyBirdDeadline);
                const effectiveAmount = isEarlyBird ? parseFloat(p.earlyBirdAmount) : parseFloat(p.amount || "0");

                return (
                    <Card key={p.id} className="flex flex-col h-full hover:shadow-md transition-shadow relative overflow-hidden">
                        <CardHeader>
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex gap-1.5 flex-wrap">
                                    <Badge variant={isPaid ? "default" : "secondary"} className="mb-2">
                                        {isPaid ? (isEarlyBird ? `Early Bird ₦${Number(p.earlyBirdAmount).toLocaleString()}` : `₦${Number(p.amount).toLocaleString()}`) : "Free Entry"}
                                    </Badge>
                                    {isEarlyBird && isPaid && (
                                        <Badge className="bg-emerald-600 text-white mb-2">Till {new Date(p.earlyBirdDeadline).toLocaleDateString()}</Badge>
                                    )}
                                    {p.status === 'POSTPONED' && (
                                        <Badge className="bg-orange-600 hover:bg-orange-700 text-white font-bold mb-2">POSTPONED</Badge>
                                    )}
                                    {p.status === 'CANCELLED' && (
                                        <Badge className="bg-red-600 hover:bg-red-700 text-white font-bold mb-2">CANCELLED</Badge>
                                    )}
                                </div>
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
                            {p.paymentRequired && (
                                <div className="text-[11px]">
                                    <Link href="/dashboard/programmes/bulk" className="text-emerald-700 underline">Register multiple people at once →</Link>
                                </div>
                            )}

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
                                {isPaid && isEarlyBird && (
                                    <div className="text-xs text-emerald-700 font-medium">Early bird ₦{Number(p.earlyBirdAmount).toLocaleString()} till {new Date(p.earlyBirdDeadline).toLocaleDateString()} → normal ₦{Number(p.amount).toLocaleString()}</div>
                                )}
                                {isPaid && !isEarlyBird && p.earlyBirdDeadline && new Date(p.earlyBirdDeadline) < new Date() && (
                                    <div className="text-xs text-muted-foreground">Early bird ended — normal ₦{Number(p.amount).toLocaleString()}</div>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="pt-4 border-t bg-gray-50/50 flex gap-2 w-full">
                            {(() => {
                                if (p.status === 'CANCELLED') {
                                    return (
                                        <Button className="w-full bg-red-100 hover:bg-red-100 border-red-200 text-red-700" variant="outline" disabled>
                                            <XCircle className="mr-2 h-4 w-4" />
                                            Programme Cancelled
                                        </Button>
                                    )
                                }
                                if (p.status === 'POSTPONED') {
                                    return (
                                        <Button className="w-full bg-orange-100 hover:bg-orange-100 border-orange-200 text-orange-700" variant="outline" disabled>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            Programme Postponed
                                        </Button>
                                    )
                                }

                                const reg = registeredProgrammesMap.get(p.id);
                                if (reg) {
                                    if (reg.status === 'PENDING_PAYMENT') {
                                        return (
                                            <>
                                                <Button className="flex-1 bg-orange-600 hover:bg-orange-700 text-white" asChild>
                                                    <Link href={`/programmes/registrations/${reg.id}/slip`}>
                                                        <CreditCard className="mr-2 h-4 w-4" />
                                                        Pay Now
                                                    </Link>
                                                </Button>
                                                <div className="flex-1">
                                                    <RegisterForProgrammeDialog
                                                        programmeId={p.id}
                                                        programmeTitle={p.title}
                                                        amount={effectiveAmount}
                                                        earlyBirdAmount={p.earlyBirdAmount ? parseFloat(p.earlyBirdAmount) : undefined}
                                                        earlyBirdDeadline={p.earlyBirdDeadline}
                                                        allowInstallments={p.allowInstallments || false}
                                                        minInstallmentAmount={parseFloat(p.minInstallmentAmount || "0")}
                                                        triggerText="Restart"
                                                        variant="outline"
                                                    />
                                                </div>
                                            </>
                                        )
                                    }
                                    return (
                                        <div className="flex w-full gap-2 flex-col">
                                            <Button className="w-full" variant="outline" disabled>
                                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                                Already Registered
                                            </Button>
                                            {(p as any).meeting?.shareCode && (
                                                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" asChild>
                                                    <a href={`/live/${(p as any).meeting.shareCode}`} target="_blank">
                                                        <Video className="mr-2 h-4 w-4" />
                                                        Join Virtual Room
                                                    </a>
                                                </Button>
                                            )}
                                        </div>
                                    )
                                }
                                return (
                                    <div className="w-full">
                                        <RegisterForProgrammeDialog
                                            programmeId={p.id}
                                            programmeTitle={p.title}
                                            amount={effectiveAmount}
                                            earlyBirdAmount={p.earlyBirdAmount ? parseFloat(p.earlyBirdAmount) : undefined}
                                            earlyBirdDeadline={p.earlyBirdDeadline}
                                            allowInstallments={p.allowInstallments || false}
                                            minInstallmentAmount={parseFloat(p.minInstallmentAmount || "0")}
                                        />
                                    </div>
                                )
                            })()}
                        </CardFooter>
                    </Card>
                )
            })}
        </div>
    )
}
