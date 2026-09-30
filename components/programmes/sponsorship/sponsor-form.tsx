"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createSponsorshipPool, initializeSponsorshipPayment } from "@/lib/actions/programme-sponsorship";
import { getEffectiveAmount } from "@/lib/pricing";
import { Loader2, HeartHandshake, Copy } from "lucide-react";

interface ProgrammeLite { id: string; title: string; amount: any; earlyBirdAmount?: any; earlyBirdDeadline?: any; tiers?: any[]; paymentRequired: boolean; status: string; organizationName?: string }

export function SponsorshipForm({ programmes }: { programmes: ProgrammeLite[] }) {
    const [programmeId, setProgrammeId] = useState("");
    const [sponsorName, setSponsorName] = useState("");
    const [sponsorEmail, setSponsorEmail] = useState("");
    const [sponsorPhone, setSponsorPhone] = useState("");
    const [seatCount, setSeatCount] = useState("10");
    const [notes, setNotes] = useState("");
    const [pending, startTransition] = useTransition();
    const [pool, setPool] = useState<{ poolId: string; perSeat: number; totalAmount: number; sponsorCode: string } | null>(null);

    async function handleCreate() {
        if (!programmeId) return toast.error("Choose a programme");
        if (!sponsorName.trim() || !sponsorEmail.trim()) return toast.error("Sponsor name + email required");
        const count = Math.floor(Number(seatCount));
        if (!count || count < 1) return toast.error("Seat count must be at least 1");
        startTransition(async () => {
            const res: any = await createSponsorshipPool({
                programmeId,
                sponsorName: sponsorName.trim(),
                sponsorEmail: sponsorEmail.trim(),
                sponsorPhone: sponsorPhone.trim() || undefined,
                seatCount: count,
                notes: notes.trim() || undefined,
            });
            if (res.success) {
                setPool({ poolId: res.poolId, perSeat: res.perSeat, totalAmount: res.totalAmount, sponsorCode: res.sponsorCode });
                toast.success(`Sponsorship created: ${count} seats, ₦${Number(res.totalAmount).toLocaleString()} total`);
            } else toast.error(res.error || "Failed");
        });
    }

    async function handlePay() {
        if (!pool) return;
        startTransition(async () => {
            const res: any = await initializeSponsorshipPayment(pool.poolId);
            if (res.success && (res as any).authorizationUrl) {
                window.location.href = (res as any).authorizationUrl;
            } else toast.error(res.error || "Payment init failed");
        });
    }

    const eligible = programmes.filter(p => p.status === "APPROVED" && p.paymentRequired);

    return (
        <div className="space-y-4">
            {!pool ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label>Programme</Label>
                            <select value={programmeId} onChange={(e) => setProgrammeId(e.target.value)} className="w-full border rounded-md h-9 px-3 text-sm">
                                <option value="">Select programme…</option>
                        {eligible.map(p => {
                            const effective = getEffectiveAmount({ amount: p.amount, earlyBirdAmount: p.earlyBirdAmount, earlyBirdDeadline: p.earlyBirdDeadline, tiers: p.tiers });
                            return (
                                <option key={p.id} value={p.id}>{p.title} — ₦{Number(effective || 0).toLocaleString()}{effective < Number(p.amount || 0) ? " (early bird)" : ""}</option>
                            );
                        })}
                            </select>
                            <p className="text-xs text-muted-foreground mt-1">Only paid, approved programmes can be sponsored. Price follows the active early bird window.</p>
                        </div>
                        <div>
                            <Label>Number of seats to sponsor</Label>
                            <Input type="number" min={1} max={500} value={seatCount} onChange={(e) => setSeatCount(e.target.value)} />
                            <p className="text-xs text-muted-foreground mt-1">Beneficiary names are NOT needed — members claim seats with your sponsor code.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label>Sponsor name</Label>
                            <Input value={sponsorName} onChange={(e) => setSponsorName(e.target.value)} placeholder="Full name / organisation" />
                        </div>
                        <div>
                            <Label>Sponsor email</Label>
                            <Input type="email" value={sponsorEmail} onChange={(e) => setSponsorEmail(e.target.value)} placeholder="email@example.com" />
                        </div>
                        <div>
                            <Label>Phone (optional)</Label>
                            <Input value={sponsorPhone} onChange={(e) => setSponsorPhone(e.target.value)} placeholder="080..." />
                        </div>
                    </div>
                    <div>
                        <Label>Notes (optional)</Label>
                        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="e.g. For indigent members of Ikeja LGA" />
                    </div>
                    <Button onClick={handleCreate} disabled={pending} className="w-full bg-emerald-700 hover:bg-emerald-800">
                        {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <HeartHandshake className="h-4 w-4 mr-2" />}
                        Create sponsorship
                    </Button>
                </>
            ) : (
                <div className="space-y-3">
                    <div className="rounded-lg border p-4 bg-emerald-50 text-sm">
                        <b>Sponsorship created.</b> {seatCount} seats · ₦{pool.perSeat.toLocaleString()} each · <b>Total: ₦{pool.totalAmount.toLocaleString()}</b>
                        <p className="mt-1 text-emerald-800">Pay now to activate the seats. Your sponsor code <b>{pool.sponsorCode}</b> becomes usable once payment succeeds.</p>
                    </div>
                    <Button onClick={handlePay} disabled={pending} className="w-full bg-amber-600 hover:bg-amber-700">
                        {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Pay ₦{pool.totalAmount.toLocaleString()} now (Paystack)
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => { navigator.clipboard.writeText(pool.sponsorCode); toast.success("Sponsor code copied"); }}>
                        <Copy className="h-4 w-4 mr-2" /> Copy sponsor code
                    </Button>
                </div>
            )}
        </div>
    );
}
