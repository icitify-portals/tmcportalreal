import { verifyBulkPayment, listBulkAttendees } from "@/lib/actions/programme-bulk";
import { redirect } from "next/navigation";
import { PublicNav } from "@/components/layout/public-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { bulkRegistrationGroups, programmes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function PublicVerifyBulkPage({
    searchParams,
}: {
    searchParams: Promise<{ group?: string; reference?: string; trxref?: string }>;
}) {
    const sp = await searchParams;
    const groupId = sp?.group ?? "";
    const paymentRef = sp?.reference || sp?.trxref;

    if (!groupId) redirect("/programmes/pay-for-others");

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
    if (!row) redirect("/programmes/pay-for-others");

    const claimed = (await listBulkAttendees(groupId)).filter((a: any) => a.bulkClaimedAt).length;

    return (
        <div className="min-h-screen bg-gray-50">
            <PublicNav />
            <div className="p-4 md:p-8 max-w-xl mx-auto space-y-4">
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
                            <p>We could not verify this payment. Please try paying again.</p>
                        ) : (
                            <>
                                <p>
                                    <b>{row.programme?.title}</b> — {row.group.attendeeCount} attendees ·
                                    ₦{Number(row.group.totalAmount || 0).toLocaleString()} ·{" "}
                                    <Badge variant={row.group.status === "PAID" ? "default" : "secondary"}>{row.group.status}</Badge>
                                </p>
                                {row.group.status === "PAID" && (
                                    <p className="text-emerald-800">{claimed} of {row.group.attendeeCount} seats claimed so far.</p>
                                )}
                            </>
                        )}
                        <div className="flex flex-wrap gap-2">
                            <Button asChild variant="outline">
                                <Link href={`/programmes/bulk/manage?group=${groupId}`}>Manage this group</Link>
                            </Button>
                            <Button asChild>
                                <Link href="/programmes/pay-for-others">Back</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
