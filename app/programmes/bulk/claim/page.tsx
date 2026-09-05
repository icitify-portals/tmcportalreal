import { Suspense } from "react";
import { getBulkSeatByToken } from "@/lib/actions/programme-bulk";
import { ClaimForm } from "@/components/programmes/bulk/claim-form";
import { PublicNav } from "@/components/layout/public-nav";
import { AlertCircle } from "lucide-react";

export default async function BulkClaimPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
    const sp = await searchParams;
    const token = sp?.token ?? "";
    const data = await getBulkSeatByToken(token);

    return (
        <div className="min-h-screen bg-gray-50">
            <PublicNav />
            <div className="max-w-2xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-extrabold tracking-tight">Confirm your programme seat</h1>
                <p className="text-sm text-muted-foreground mb-6">Your seat has been pre-paid by your group. Complete your details to finalise your registration.</p>
                {!data ? (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 mt-0.5" />
                        <div>This link is invalid, expired, or has already been used. Please contact your group coordinator.</div>
                    </div>
                ) : data.registration.bulkClaimedAt ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                        You've already claimed your seat for <b>{data.programme?.title}</b> on {new Date(data.registration.bulkClaimedAt).toLocaleString()}.
                    </div>
                ) : (
                    <Suspense fallback={<div className="text-sm">Loading…</div>}>
                        <ClaimForm token={token} registration={data.registration} programme={data.programme} />
                    </Suspense>
                )}
            </div>
        </div>
    );
}
