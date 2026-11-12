import { Suspense } from "react";
import { getSponsorshipPoolByCode, verifySponsorshipPayment } from "@/lib/actions/programme-sponsorship";
import { SponsoredClaimForm } from "@/components/programmes/sponsorship/claim-form";
import { PublicNav } from "@/components/layout/public-nav";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, HelpCircle, RefreshCw, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SponsoredClaimPage({ 
    searchParams 
}: { 
    searchParams: Promise<{ code?: string; recheck?: string }> 
}) {
    const sp = await searchParams;
    const rawCode = (sp?.code || "").trim();
    const shouldRecheck = sp?.recheck === "true";

    let data = rawCode ? await getSponsorshipPoolByCode(rawCode) : null;

    if (data && shouldRecheck && data.pool.status === "PENDING" && data.pool.paymentRef) {
        await verifySponsorshipPayment(data.pool.id, data.pool.paymentRef);
        data = await getSponsorshipPoolByCode(rawCode);
    }

    const currentCode = data?.pool?.sponsorCode || rawCode;

    return (
        <div className="min-h-screen bg-gray-50">
            <PublicNav />
            <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight">Claim a sponsored seat</h1>
                    <p className="text-sm text-muted-foreground">
                        Enter the sponsor code you received, then complete your details. No personal payment is needed.
                    </p>
                </div>

                <form action="/programmes/sponsored/claim" method="GET" className="flex gap-2">
                    <Input 
                        name="code" 
                        defaultValue={currentCode} 
                        placeholder="e.g. SP-A1B2C3D4 or A1B2C3D4" 
                        className="font-mono uppercase text-base" 
                        autoFocus
                    />
                    <Button type="submit" variant="default" className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold">
                        Look up
                    </Button>
                </form>

                {rawCode && !data && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 space-y-2">
                        <div className="flex items-start gap-2 font-semibold">
                            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                            <span>Invalid sponsor code</span>
                        </div>
                        <p className="text-xs text-rose-800 leading-relaxed pl-7">
                            We could not find any sponsorship matching <strong className="font-mono bg-rose-100 px-1 py-0.5 rounded">{rawCode}</strong>.
                        </p>
                        <div className="pl-7 pt-1 text-xs text-rose-700 space-y-1">
                            <p className="font-semibold flex items-center gap-1">
                                <HelpCircle className="h-3.5 w-3.5" /> Quick troubleshooting tips:
                            </p>
                            <ul className="list-disc list-inside space-y-0.5 pl-1 text-[11px]">
                                <li>Ensure you entered the full 8-character hex code (e.g. <code>SP-A1B2C3D4</code> or simply <code>A1B2C3D4</code>).</li>
                                <li>Check for character confusion: ensure you typed number <code>0</code> (zero) instead of letter <code>O</code>, or number <code>1</code> instead of <code>I/L</code>.</li>
                                <li>If the sponsor just created the code, verify with them that payment was completed.</li>
                            </ul>
                        </div>
                    </div>
                )}

                {data && (
                    <div className="space-y-4">
                        <div className="rounded-xl border border-slate-200 p-4 bg-white shadow-xs space-y-2">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="font-bold text-base text-slate-900">{data.programme?.title}</h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Sponsored by <strong className="text-slate-800 font-semibold">{data.pool.sponsorName}</strong>
                                    </p>
                                </div>
                                <span className="font-mono font-bold text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-1 rounded">
                                    {data.pool.sponsorCode}
                                </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 pt-2 border-t text-xs">
                                <span className="text-muted-foreground">
                                    Allocation: <strong>{data.pool.seatCount} seats</strong> ({data.pool.seatsClaimed || 0} claimed)
                                </span>
                                <span>&bull;</span>
                                {data.pool.status === "PAID" ? (
                                    data.seatsLeft > 0 ? (
                                        <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                                            <CheckCircle2 className="h-3.5 w-3.5" /> {data.seatsLeft} seat(s) available to claim
                                        </span>
                                    ) : (
                                        <span className="font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                                            All seats claimed
                                        </span>
                                    )
                                ) : (
                                    <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded flex items-center gap-1">
                                        <Clock className="h-3.5 w-3.5" /> Payment pending from sponsor
                                    </span>
                                )}
                            </div>
                        </div>

                        {data.pool.status === "PAID" && data.seatsLeft > 0 ? (
                            <Suspense fallback={<div className="text-sm p-4 text-center">Loading claim form…</div>}>
                                <SponsoredClaimForm sponsorCode={data.pool.sponsorCode} programmeTitle={data.programme?.title} />
                            </Suspense>
                        ) : data.pool.status !== "PAID" ? (
                            <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-5 text-sm text-amber-900 space-y-3">
                                <div className="flex items-center gap-2 font-bold text-amber-950">
                                    <Clock className="h-5 w-5 text-amber-600" />
                                    Sponsorship Payment Pending
                                </div>
                                <p className="text-xs text-amber-800 leading-relaxed">
                                    This sponsorship code (<strong>{data.pool.sponsorCode}</strong>) has been registered by <strong>{data.pool.sponsorName}</strong>, but the payment has not completed on Paystack yet.
                                </p>
                                <div className="pt-2 flex flex-wrap gap-2">
                                    {data.pool.paymentRef && (
                                        <Button asChild size="sm" variant="outline" className="border-amber-400 bg-amber-100/60 hover:bg-amber-200 text-amber-950 font-semibold text-xs">
                                            <Link href={`/programmes/sponsored/claim?code=${encodeURIComponent(data.pool.sponsorCode)}&recheck=true`}>
                                                <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Re-check Payment Status
                                            </Link>
                                        </Button>
                                    )}
                                    <Button asChild size="sm" variant="ghost" className="text-xs text-amber-900">
                                        <Link href="/programmes/sponsored/claim">Try another code</Link>
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-800 space-y-2">
                                <div className="font-bold flex items-center gap-2 text-slate-900">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                    All Sponsored Seats Claimed
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    All <strong>{data.pool.seatCount}</strong> seats sponsored under code <strong>{data.pool.sponsorCode}</strong> have already been claimed by participants.
                                </p>
                                <div className="pt-2 flex gap-2">
                                    <Button asChild size="sm" variant="outline">
                                        <Link href="/programmes/sponsored/claim">Claim with another code</Link>
                                    </Button>
                                    <Button asChild size="sm" variant="default" className="bg-emerald-700 hover:bg-emerald-800 text-white">
                                        <Link href="/programmes/pay-for-others">Sponsor more seats</Link>
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
