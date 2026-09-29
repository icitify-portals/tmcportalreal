import { verifyContestPayment, getContestById } from "@/lib/actions/contests";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ContestVerifyPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ rep?: string; reference?: string; trxref?: string }>;
}) {
    const { id } = await params;
    const sp = await searchParams;
    const representativeId = sp?.rep ?? "";
    const paymentRef = sp?.reference || sp?.trxref;

    if (!representativeId) redirect(`/contests-live/${id}`);

    let status: "ok" | "failed" | "nopay" = "nopay";
    if (paymentRef) {
        const result = await verifyContestPayment(representativeId, paymentRef);
        status = result.success ? "ok" : "failed";
    }

    const contest = await getContestById(id);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-8 text-center space-y-4">
                    {status === "failed" ? (
                        <>
                            <XCircle className="h-14 w-14 mx-auto text-rose-500" />
                            <h1 className="text-xl font-bold text-gray-900">Payment verification failed</h1>
                            <p className="text-sm text-gray-600">
                                We could not verify this payment. No fee was recorded. Please try paying again, or contact the organizer.
                            </p>
                        </>
                    ) : status === "ok" ? (
                        <>
                            <CheckCircle2 className="h-14 w-14 mx-auto text-emerald-500" />
                            <h1 className="text-xl font-bold text-gray-900">Payment confirmed</h1>
                            <p className="text-sm text-gray-600">
                                Thank you! Your contest fee for <b>{contest?.title || "the contest"}</b> has been received. Your registration is now confirmed.
                            </p>
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="h-14 w-14 mx-auto text-emerald-500" />
                            <h1 className="text-xl font-bold text-gray-900">Registration received</h1>
                            <p className="text-sm text-gray-600">Your contest registration has been recorded.</p>
                        </>
                    )}
                    <div className="flex flex-col gap-2 pt-2">
                        <Button asChild className="bg-emerald-700 hover:bg-emerald-800">
                            <Link href={`/contests-live/${id}`}>Back to contest</Link>
                        </Button>
                        {status === "failed" && (
                            <Button asChild variant="outline">
                                <Link href={`/contests-live/${id}/apply`}>Try registering again</Link>
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
