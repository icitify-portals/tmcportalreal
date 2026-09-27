import { verifySponsorshipPayment } from "@/lib/actions/programme-sponsorship";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { programmeSponsorshipPools } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function VerifySponsorshipPage({
    searchParams,
}: {
    searchParams: Promise<{ pool?: string; reference?: string; trxref?: string }>;
}) {
    const sp = await searchParams;
    const poolId = sp?.pool ?? "";
    const paymentRef = sp?.reference || sp?.trxref;

    if (!poolId) redirect("/dashboard/programmes/sponsorship");

    let status: "ok" | "failed" | "nopay" = "nopay";
    let code = "";
    if (paymentRef) {
        const result = await verifySponsorshipPayment(poolId, paymentRef);
        status = result.success ? "ok" : "failed";
        code = (result as any)?.sponsorCode || "";
    }
    // Fetch pool to display the code even on re-visit (already paid)
    const [pool] = await db.select().from(programmeSponsorshipPools).where(eq(programmeSponsorshipPools.id, poolId)).limit(1);
    if (pool?.sponsorCode) code = pool.sponsorCode;

    return (
        <DashboardLayout>
            <div className="p-4 md:p-8 max-w-xl space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            {status === "failed" ? (
                                <><XCircle className="h-5 w-5 text-rose-600" /> Payment verification failed</>
                            ) : (
                                <><CheckCircle2 className="h-5 w-5 text-emerald-600" /> Sponsorship {pool?.status === "PAID" ? "active" : "received"}</>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        {status === "failed" ? (
                            <p>We could not verify this payment. No seat was activated. Please try paying again from your sponsorships list.</p>
                        ) : (
                            <>
                                <p>
                                    {pool?.seatCount} seats sponsored · {pool?.seatsClaimed || 0} claimed so far.
                                    Share the code below with beneficiaries — they claim at{" "}
                                    <Link href="/programmes/sponsored/claim" className="text-emerald-700 underline">the sponsored claim page</Link>.
                                </p>
                                {code && (
                                    <div className="flex items-center gap-2 rounded-md bg-emerald-50 border border-emerald-200 p-3">
                                        <span className="font-mono font-bold tracking-widest text-lg">{code}</span>
                                    </div>
                                )}
                            </>
                        )}
                        <div className="flex gap-2">
                            <Button asChild variant="outline"><Link href="/dashboard/programmes/sponsorship">Back to sponsorships</Link></Button>
                            <Button asChild><Link href="/programmes/sponsored/claim">Open claim page</Link></Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
