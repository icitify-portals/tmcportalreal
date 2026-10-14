"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { createSponsorshipPool, initializeSponsorshipPayment } from "@/lib/actions/programme-sponsorship";
import { getEffectiveAmount } from "@/lib/pricing";
import { Loader2, HeartHandshake, Copy, Plus, Trash2, Users } from "lucide-react";

interface ProgrammeLite { id: string; title: string; amount: any; earlyBirdAmount?: any; earlyBirdDeadline?: any; tiers?: any[]; paymentRequired: boolean; status: string; organizationName?: string }

interface Beneficiary {
    name: string;
    email: string;
    phone: string;
    gender: string;
    state: string;
    lga: string;
    branch: string;
    memberId: string;
}

export function SponsorshipForm({ programmes }: { programmes: ProgrammeLite[] }) {
    const [programmeId, setProgrammeId] = useState("");
    const [sponsorName, setSponsorName] = useState("");
    const [sponsorEmail, setSponsorEmail] = useState("");
    const [sponsorPhone, setSponsorPhone] = useState("");
    const [seatCount, setSeatCount] = useState("10");
    const [notes, setNotes] = useState("");
    const [pending, startTransition] = useTransition();
    const [pool, setPool] = useState<{ poolId: string; perSeat: number; totalAmount: number; sponsorCode: string } | null>(null);
    const [namedMode, setNamedMode] = useState(false);
    const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([{ name: "", email: "", phone: "", gender: "MALE", state: "", lga: "", branch: "", memberId: "" }]);

    function addBeneficiary() {
        setBeneficiaries([...beneficiaries, { name: "", email: "", phone: "", gender: "MALE", state: "", lga: "", branch: "", memberId: "" }]);
    }
    function removeBeneficiary(idx: number) {
        setBeneficiaries(beneficiaries.filter((_, i) => i !== idx));
    }
    function updateBeneficiary(idx: number, field: keyof Beneficiary, value: string) {
        setBeneficiaries(beneficiaries.map((b, i) => i === idx ? { ...b, [field]: value } : b));
    }

    async function handleCreate() {
        if (!programmeId) return toast.error("Choose a programme");
        if (!sponsorName.trim() || !sponsorEmail.trim()) return toast.error("Sponsor name + email required");
        const count = Math.floor(Number(seatCount));
        if (!count || count < 1) return toast.error("Seat count must be at least 1");
        if (namedMode) {
            const valid = beneficiaries.filter(b => b.name.trim() && b.email.trim());
            if (valid.length === 0) return toast.error("Add at least one beneficiary with name and email");
            if (valid.length > count) return toast.error(`Beneficiaries (${valid.length}) exceed seat count (${count})`);
        }
        startTransition(async () => {
            const res: any = await createSponsorshipPool({
                programmeId,
                sponsorName: sponsorName.trim(),
                sponsorEmail: sponsorEmail.trim(),
                sponsorPhone: sponsorPhone.trim() || undefined,
                seatCount: count,
                notes: notes.trim() || undefined,
                beneficiaries: namedMode ? beneficiaries : undefined,
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
                            <p className="text-xs text-muted-foreground mt-1">Only paid, approved programmes can be sponsored.</p>
                        </div>
                        <div>
                            <Label>Number of seats to sponsor</Label>
                            <Input type="number" min={1} max={500} value={seatCount} onChange={(e) => setSeatCount(e.target.value)} />
                            <p className="text-xs text-muted-foreground mt-1">
                                {namedMode ? "Enter names now, or leave blank for claim-by-code." : "Members claim seats with your sponsor code."}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                        <input type="checkbox" id="namedMode" checked={namedMode} onChange={(e) => setNamedMode(e.target.checked)} className="w-4 h-4 text-emerald-600 rounded" />
                        <Label htmlFor="namedMode" className="font-medium cursor-pointer">
                            <Users className="h-4 w-4 inline mr-2" />
                            <strong>Named sponsorship</strong> — provide beneficiary details now (optional)
                        </Label>
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

                    {namedMode && (
                        <div className="space-y-3 pt-2 border-t">
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium">Beneficiaries</h4>
                                <Button type="button" variant="outline" size="sm" onClick={addBeneficiary} disabled={beneficiaries.length >= parseInt(seatCount) || beneficiaries.length >= 50}>
                                    <Plus className="h-4 w-4 mr-1" /> Add beneficiary
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {beneficiaries.map((b, idx) => (
                                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 p-3 border rounded-lg bg-white">
                                        <div className="lg:col-span-2">
                                            <Label className="text-xs">Name *</Label>
                                            <Input value={b.name} onChange={e => updateBeneficiary(idx, "name", e.target.value)} placeholder="Full name" required />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Email *</Label>
                                            <Input type="email" value={b.email} onChange={e => updateBeneficiary(idx, "email", e.target.value)} placeholder="email@example.com" required />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Phone</Label>
                                            <Input value={b.phone} onChange={e => updateBeneficiary(idx, "phone", e.target.value)} placeholder="080..." />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Gender</Label>
                                            <Select value={b.gender} onValueChange={v => updateBeneficiary(idx, "gender", v)}>
                                                <SelectTrigger><SelectValue placeholder="Gender" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="MALE">Male</SelectItem>
                                                    <SelectItem value="FEMALE">Female</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label className="text-xs">State</Label>
                                            <Input value={b.state} onChange={e => updateBeneficiary(idx, "state", e.target.value)} placeholder="State" />
                                        </div>
                                        <div>
                                            <Label className="text-xs">LGA</Label>
                                            <Input value={b.lga} onChange={e => updateBeneficiary(idx, "lga", e.target.value)} placeholder="LGA" />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Branch</Label>
                                            <Input value={b.branch} onChange={e => updateBeneficiary(idx, "branch", e.target.value)} placeholder="Branch" />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Member ID (optional)</Label>
                                            <Input value={b.memberId} onChange={e => updateBeneficiary(idx, "memberId", e.target.value)} placeholder="TMC-..." />
                                        </div>
                                        <div className="flex items-end">
                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeBeneficiary(idx)} className="text-red-500 hover:bg-red-50">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground">Max {Math.min(parseInt(seatCount) || 50, 50)} beneficiaries. Unfilled seats can still be claimed via the sponsor code.</p>
                        </div>
                    )}

                    <Button onClick={handleCreate} disabled={pending} className="w-full bg-emerald-700 hover:bg-emerald-800">
                        {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <HeartHandshake className="h-4 w-4 mr-2" />}
                        {namedMode ? "Create named sponsorship" : "Create sponsorship (claim by code)"}
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