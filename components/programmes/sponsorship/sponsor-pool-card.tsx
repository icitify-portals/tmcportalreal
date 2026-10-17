"use client";

import { useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { initializeSponsorshipPayment } from "@/lib/actions/programme-sponsorship";
import { Loader2, Copy, HeartHandshake, Eye, Link2, TicketCheck } from "lucide-react";
import Link from "next/link";

export function SponsorPoolCard({ pool, programmeTitle }: { pool: any; programmeTitle?: string }) {
    const [pending, startTransition] = useTransition();
    const seatsLeft = Math.max(0, (pool.seatCount || 0) - (pool.seatsClaimed || 0));

    async function handlePay() {
        startTransition(async () => {
            const res: any = await initializeSponsorshipPayment(pool.id);
            if (res.success && (res as any).authorizationUrl) {
                window.location.href = (res as any).authorizationUrl;
            } else toast.error(res.error || "Payment init failed");
        });
    }

    function copyClaimLink() {
        const origin = typeof window !== "undefined" ? window.location.origin : "https://tmcng.net";
        const url = `${origin}/programmes/sponsored/claim?code=${encodeURIComponent(pool.sponsorCode)}`;
        navigator.clipboard.writeText(url);
        toast.success("Direct claim link copied! Share this link with beneficiaries.");
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2"><HeartHandshake className="h-4 w-4 text-emerald-700" />{programmeTitle || "Programme"}</span>
                    <Badge variant={pool.status === "PAID" ? "default" : "secondary"}>{pool.status}</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
                <p>{pool.seatCount} seats · {pool.seatsClaimed || 0} claimed · {seatsLeft} left · ₦{Number(pool.totalAmount || 0).toLocaleString()} total</p>
                {pool.status === "PAID" ? (
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold tracking-widest bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">{pool.sponsorCode}</span>
                        <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(pool.sponsorCode); toast.success("Sponsor code copied — share it with beneficiaries"); }}>
                            <Copy className="h-3 w-3 mr-1" /> Copy code
                        </Button>
                        <Button size="sm" variant="outline" onClick={copyClaimLink}>
                            <Link2 className="h-3 w-3 mr-1" /> Copy claim link
                        </Button>
                        {seatsLeft > 0 && (
                            <Button size="sm" asChild className="bg-emerald-700 hover:bg-emerald-800">
                                <Link href={`/programmes/sponsored/claim?code=${encodeURIComponent(pool.sponsorCode)}`}>
                                    <TicketCheck className="h-3.5 w-3.5 mr-1" /> Claim / Assign seat
                                </Link>
                            </Button>
                        )}
                        <Link href={`/dashboard/programmes/sponsorship/${pool.id}`} className="text-emerald-700 hover:underline text-sm flex items-center gap-1 ml-1">
                            <Eye className="h-3.5 w-3.5" /> View claimers ({pool.seatsClaimed || 0})
                        </Link>
                    </div>
                ) : pool.status === "PENDING" ? (
                    <Button onClick={handlePay} disabled={pending} className="w-full bg-amber-600 hover:bg-amber-700">
                        {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Pay ₦{Number(pool.totalAmount || 0).toLocaleString()} now
                    </Button>
                ) : null}
            </CardContent>
        </Card>
    );
}
