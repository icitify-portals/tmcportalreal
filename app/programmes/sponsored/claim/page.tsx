import { Suspense } from "react";
import { getSponsorshipPoolByCode } from "@/lib/actions/programme-sponsorship";
import { SponsoredClaimForm } from "@/components/programmes/sponsorship/claim-form";
import { PublicNav } from "@/components/layout/public-nav";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SponsoredClaimPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
    const sp = await searchParams;
    const code = (sp?.code || "").trim().toUpperCase();
    const data = code ? await getSponsorshipPoolByCode(code) : null;

    return (
        <div className="min-h-screen bg-gray-50">
            <PublicNav />
            <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight">Claim a sponsored seat</h1>
                    <p className="text-sm text-muted-foreground">Enter the sponsor code you received, then complete your details. No payment needed.</p>
                </div>

                <form action="/programmes/sponsored/claim" method="GET" className="flex gap-2">
                    <Input name="code" defaultValue={code} placeholder="e.g. SP-A1B2C3D4" className="font-mono uppercase" />
                    <Button type="submit" variant="outline">Look up</Button>
                </form>

                {code && !data && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 mt-0.5" />
                        <div>Invalid sponsor code. Please check and try again, or contact the sponsor.</div>
                    </div>
                )}

                {data && (
                    <div className="space-y-4">
                        <div className="rounded-xl border p-4 bg-white text-sm">
                            <p className="font-bold">{data.programme?.title}</p>
                            <p className="text-muted-foreground">
                                Sponsored by {data.pool.sponsorName} · {data.pool.seatsClaimed || 0} of {data.pool.seatCount} seats claimed
                                {data.pool.status !== "PAID" ? " · Not yet paid for" : data.seatsLeft <= 0 ? " · Fully claimed" : ` · ${data.seatsLeft} left`}
                            </p>
                        </div>
                        {data.pool.status === "PAID" && data.seatsLeft > 0 ? (
                            <Suspense fallback={<div className="text-sm">Loading…</div>}>
                                <SponsoredClaimForm sponsorCode={data.pool.sponsorCode} programmeTitle={data.programme?.title} />
                            </Suspense>
                        ) : (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                                {data.pool.status !== "PAID"
                                    ? "The sponsor has not completed payment yet. Please check back later."
                                    : "All sponsored seats for this code have been claimed."}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
