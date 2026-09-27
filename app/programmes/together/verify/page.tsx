import { verifyTogetherPayment } from "@/lib/actions/programme-together";
import { redirect } from "next/navigation";
import { PublicNav } from "@/components/layout/public-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TogetherVerifyPage({
    searchParams,
}: {
    searchParams: Promise<{ reg?: string; group?: string; pool?: string; reference?: string; trxref?: string }>;
}) {
    const sp = await searchParams;
    const registrationId = sp?.reg ?? "";
    const groupId = sp?.group || undefined;
    const poolId = sp?.pool || undefined;
    const paymentRef = sp?.reference || sp?.trxref;

    if (!registrationId) redirect("/programmes");

    let status: "ok" | "failed" | "nopay" = "nopay";
    let result: any = null;
    if (paymentRef) {
        result = await verifyTogetherPayment({ registrationId, groupId, poolId, reference: paymentRef });
        status = result.success ? "ok" : "failed";
    }

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
                                <><CheckCircle2 className="h-5 w-5 text-emerald-600" /> Combined payment {status === "ok" ? "confirmed" : "received"}</>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        {status === "failed" ? (
                            <p>We could not verify this payment ({result?.error || "unknown error"}). No seat was activated. Please try again.</p>
                        ) : (
                            <>
                                <p>Your own registration plus the extra seats are now paid for in a single transaction.</p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>
                                        <Link href={`/programmes/registrations/${registrationId}/slip`} className="text-emerald-700 underline">
                                            Open your access slip
                                        </Link>
                                    </li>
                                    {groupId && (
                                        <li>
                                            <Link href={`/programmes/bulk/manage?group=${groupId}`} className="text-emerald-700 underline">
                                                Manage named seats (claim links)
                                            </Link>
                                        </li>
                                    )}
                                    {result?.sponsorCode && (
                                        <li>
                                            Sponsor code: <span className="font-mono font-bold tracking-widest">{result.sponsorCode}</span> —{" "}
                                            <Link href="/programmes/sponsored/claim" className="text-emerald-700 underline">
                                                open claim page
                                            </Link>
                                        </li>
                                    )}
                                    {poolId && !result?.sponsorCode && (
                                        <li>
                                            <Link href="/programmes/sponsored/claim" className="text-emerald-700 underline">
                                                Open sponsored claim page
                                            </Link>
                                        </li>
                                    )}
                                </ul>
                            </>
                        )}
                        <div className="flex gap-2">
                            <Button asChild variant="outline"><Link href="/programmes">Back to programmes</Link></Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
