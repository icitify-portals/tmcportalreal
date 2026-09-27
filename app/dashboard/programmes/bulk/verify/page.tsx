import { verifyBulkPayment, listBulkAttendees } from "@/lib/actions/programme-bulk";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, ExternalLink, Users } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { bulkRegistrationGroups, programmes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function VerifyBulkPage({
    searchParams,
}: {
    searchParams: Promise<{ group?: string; reference?: string; trxref?: string }>;
}) {
    const sp = await searchParams;
    const groupId = sp?.group ?? "";
    const paymentRef = sp?.reference || sp?.trxref;

    if (!groupId) redirect("/dashboard/programmes/bulk");

    let status: "ok" | "failed" | "nopay" = "nopay";
    if (paymentRef) {
        const result = await verifyBulkPayment(groupId, paymentRef);
        status = result.success ? "ok" : "failed";
    }

    const [row] = await db
        .select({ group: bulkRegistrationGroups, programme: programmes })
        .from(bulkRegistrationGroups)
        .leftJoin(programmes, eq(programmes.id, bulkRegistrationGroups.programmeId))
        .where(eq(bulkRegistrationGroups.id, groupId))
        .limit(1);
    if (!row) redirect("/dashboard/programmes/bulk");

    const attendees = await listBulkAttendees(groupId);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "";

    return (
        <DashboardLayout>
            <div className="p-4 md:p-8 max-w-2xl space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            {status === "failed" ? (
                                <><XCircle className="h-5 w-5 text-rose-600" /> Payment verification failed</>
                            ) : (
                                <><CheckCircle2 className="h-5 w-5 text-emerald-600" /> Bulk payment {row.group.status === "PAID" ? "confirmed" : "received"}</>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        {status === "failed" ? (
                            <p>We could not verify this payment. No attendee was marked as paid. Please try paying again from your bulk groups list.</p>
                        ) : (
                            <>
                                <p>
                                    <b>{row.programme?.title}</b> — {row.group.attendeeCount} attendees ·
                                    ₦{Number(row.group.totalAmount || 0).toLocaleString()} total ·{" "}
                                    <Badge variant={row.group.status === "PAID" ? "default" : "secondary"}>{row.group.status}</Badge>
                                </p>
                                {row.group.status === "PAID" ? (
                                    <p className="text-emerald-800">
                                        All seats are paid. Share each attendee&apos;s claim link below so they can complete their profiles.
                                    </p>
                                ) : (
                                    <p className="text-amber-800">Payment is still pending for this group. Attendees can claim once it is paid.</p>
                                )}
                            </>
                        )}
                        <div className="flex gap-2">
                            <Button asChild variant="outline"><Link href="/dashboard/programmes/bulk">Back to bulk groups</Link></Button>
                        </div>
                    </CardContent>
                </Card>

                {status !== "failed" && attendees.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4 text-emerald-700" />Attendee claim links</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1">
                            {attendees.map((a: any) => {
                                const link = `${baseUrl}/programmes/bulk/claim?token=${a.bulkClaimToken}`;
                                return (
                                    <div key={a.id} className="flex items-center gap-2 text-xs p-2 border rounded bg-gray-50">
                                        <span className="flex-1 truncate">{a.name} · {a.email}</span>
                                        {a.bulkClaimedAt && <Badge variant="outline" className="bg-emerald-50">claimed</Badge>}
                                        <a href={link} target="_blank" rel="noreferrer" className="text-emerald-700" title="Open claim link">
                                            <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}
