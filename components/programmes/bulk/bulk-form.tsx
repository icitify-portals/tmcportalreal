"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { createBulkRegistration, initializeBulkPayment } from "@/lib/actions/programme-bulk";
import { Loader2, Plus, Trash2, Copy } from "lucide-react";

interface ProgrammeLite { id: string; title: string; amount: any; earlyBirdAmount: any; earlyBirdDeadline: any; paymentRequired: boolean; status: string; organizationName?: string }

export function BulkRegistrationForm({ programmes: preselectedProgrammes }: { programmes?: ProgrammeLite[] }) {
    const router = useRouter();
    const [programmeId, setProgrammeId] = useState("");
    const [programmes, setProgrammes] = useState<ProgrammeLite[]>(preselectedProgrammes || []);
    const [paymasterName, setPaymasterName] = useState("");
    const [paymasterEmail, setPaymasterEmail] = useState("");
    const [paymasterPhone, setPaymasterPhone] = useState("");
    const [attendees, setAttendees] = useState([{ name: "", email: "", phone: "" }, { name: "", email: "", phone: "" }]);
    const [notes, setNotes] = useState("");
    const [pending, startTransition] = useTransition();
    const [groupId, setGroupId] = useState<string | null>(null);
    const [perAttendee, setPerAttendee] = useState<number>(0);
    const [totalAmount, setTotalAmount] = useState<number>(0);

    function addRow() { setAttendees((a) => [...a, { name: "", email: "", phone: "" }]); }
    function removeRow(i: number) { setAttendees((a) => a.filter((_, x) => x !== i)); }
    function update(i: number, field: string, value: string) {
        setAttendees((a) => a.map((r, x) => (x === i ? { ...r, [field]: value } : r)));
    }

    function bulkPaste(text: string) {
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        const rows = lines.map((l) => {
            const parts = l.split(/[,\t]/).map(p => p.trim());
            return { name: parts[0] || "", email: parts[1] || "", phone: parts[2] || "" };
        }).filter(r => r.name && r.email);
        if (rows.length) setAttendees(rows);
    }

    async function handleCreate() {
        if (!programmeId) return toast.error("Choose a programme");
        if (!paymasterName.trim() || !paymasterEmail.trim()) return toast.error("Paymaster name + email required");
        const cleaned = attendees.filter(a => a.name.trim() && a.email.trim());
        if (cleaned.length === 0) return toast.error("Add at least one attendee");
        startTransition(async () => {
            const res: any = await createBulkRegistration({
                programmeId, paymasterName: paymasterName.trim(), paymasterEmail: paymasterEmail.trim(),
                paymasterPhone: paymasterPhone.trim() || undefined, attendees: cleaned, notes: notes.trim() || undefined,
            });
            if (res.success) {
                setGroupId(res.groupId); setPerAttendee(res.perAttendee); setTotalAmount(res.totalAmount);
                toast.success(`Bulk group created (${cleaned.length} attendees, ${res.paymentRequired ? `₦${res.totalAmount.toLocaleString()} total` : "free"})`);
                if (res.paymentRequired) router.refresh(); else router.refresh();
            } else toast.error(res.error || "Failed");
        });
    }

    async function handlePay() {
        if (!groupId) return;
        startTransition(async () => {
            const res: any = await initializeBulkPayment(groupId);
            if (res.success && (res as any).authorizationUrl) {
                window.location.href = (res as any).authorizationUrl;
            } else if (res.free) {
                toast.success("Bulk group marked as PAID (no fee).");
                router.push("/dashboard/programmes/bulk");
            } else toast.error(res.error || "Payment init failed");
        });
    }

    const selectedProg = programmes.find(p => p.id === programmeId);

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label>Programme</Label>
                    <select value={programmeId} onChange={(e) => setProgrammeId(e.target.value)} className="w-full border rounded-md h-9 px-3 text-sm">
                        <option value="">Select programme…</option>
                        {programmes.filter(p => p.status === "APPROVED" && p.paymentRequired).map(p => (
                            <option key={p.id} value={p.id}>{p.title} — ₦{Number(p.amount || 0).toLocaleString()}</option>
                        ))}
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">Only programmes requiring payment can use bulk registration.</p>
                </div>
                <div>
                    <Label>Paymaster (you)</Label>
                    <Input value={paymasterName} onChange={(e) => setPaymasterName(e.target.value)} placeholder="Full name" />
                    <Input type="email" value={paymasterEmail} onChange={(e) => setPaymasterEmail(e.target.value)} placeholder="email@example.com" className="mt-2" />
                    <Input value={paymasterPhone} onChange={(e) => setPaymasterPhone(e.target.value)} placeholder="Phone (optional)" className="mt-2" />
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between mb-2">
                    <Label>Attendees</Label>
                    <Button size="sm" variant="outline" onClick={addRow}><Plus className="h-3 w-3 mr-1" />Add row</Button>
                </div>
                <Textarea placeholder="Or bulk paste: One attendee per line — Name, Email, Phone&#10;Ahmed Musa, ahmed@x.com, 08012345678&#10;Fatima Zahra, fatima@x.com, 08087654321" onBlur={(e) => { if (e.target.value.trim()) bulkPaste(e.target.value); }} rows={3} />
                <div className="space-y-2 mt-3 max-h-72 overflow-auto">
                    {attendees.map((a, i) => (
                        <div key={i} className="grid grid-cols-[1fr_1.4fr_1fr_36px] gap-2">
                            <Input value={a.name} onChange={(e) => update(i, "name", e.target.value)} placeholder="Full name" />
                            <Input type="email" value={a.email} onChange={(e) => update(i, "email", e.target.value)} placeholder="Email" />
                            <Input value={a.phone} onChange={(e) => update(i, "phone", e.target.value)} placeholder="Phone" />
                            <Button size="icon" variant="ghost" onClick={() => removeRow(i)} disabled={attendees.length <= 1}><Trash2 className="h-4 w-4 text-rose-500" /></Button>
                        </div>
                    ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">{attendees.filter(a => a.name.trim() && a.email.trim()).length} attendees ready</p>
            </div>

            <div>
                <Label>Notes (optional)</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>

            {!groupId ? (
                <Button onClick={handleCreate} disabled={pending} className="w-full bg-emerald-700 hover:bg-emerald-800">
                    {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                    Create bulk group
                </Button>
            ) : (
                <div className="space-y-2">
                    <div className="rounded-lg border p-4 bg-emerald-50 text-sm">
                        <b>Group created.</b> {attendees.filter(a => a.name.trim() && a.email.trim()).length} attendees · ₦{perAttendee.toLocaleString()} each · <b>Total: ₦{totalAmount.toLocaleString()}</b>
                    </div>
                    {selectedProg && Number(selectedProg.amount) > 0 ? (
                        <Button onClick={handlePay} disabled={pending} className="w-full bg-amber-600 hover:bg-amber-700">
                            {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Pay ₦{totalAmount.toLocaleString()} now (Paystack)
                        </Button>
                    ) : (
                        <p className="text-xs text-emerald-800">No payment required for this programme.</p>
                    )}
                </div>
            )}
        </div>
    );
}
