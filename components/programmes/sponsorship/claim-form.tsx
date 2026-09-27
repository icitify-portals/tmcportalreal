"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { claimSponsoredSeat } from "@/lib/actions/programme-sponsorship";
import { Loader2, TicketCheck } from "lucide-react";

export function SponsoredClaimForm({ sponsorCode, programmeTitle }: { sponsorCode: string; programmeTitle?: string }) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [memberId, setMemberId] = useState("");
    const [pending, setPending] = useState(false);
    const [done, setDone] = useState<{ registrationId: string } | null>(null);

    async function handleClaim(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim() || !email.trim()) return toast.error("Name and email are required");
        setPending(true);
        try {
            const res = await claimSponsoredSeat({ sponsorCode, name: name.trim(), email: email.trim(), phone: phone.trim() || undefined, memberId: memberId.trim() || undefined });
            if (res.success) {
                setDone({ registrationId: (res as any).registrationId });
                toast.success("Sponsored seat claimed!");
            } else {
                toast.error(res.error || "Could not claim seat");
            }
        } catch {
            toast.error("An error occurred");
        } finally {
            setPending(false);
        }
    }

    if (done) {
        return (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center space-y-3">
                <TicketCheck className="h-10 w-10 mx-auto text-emerald-600" />
                <h2 className="font-bold text-lg">Seat claimed{programmeTitle ? ` for ${programmeTitle}` : ""}!</h2>
                <p className="text-sm text-emerald-800">Your registration is fully paid by the sponsor. Open your access slip below.</p>
                <Button asChild className="bg-emerald-700 hover:bg-emerald-800">
                    <a href={`/programmes/registrations/${done.registrationId}/slip`} target="_blank">Open access slip</a>
                </Button>
            </div>
        );
    }

    return (
        <form onSubmit={handleClaim} className="space-y-4 rounded-xl border bg-white p-6">
            <div>
                <Label>Full name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" required />
            </div>
            <div>
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div>
                <Label>Phone (optional)</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="080..." />
            </div>
            <div>
                <Label>Membership ID (optional — links this seat to your TMC membership)</Label>
                <Input value={memberId} onChange={(e) => setMemberId(e.target.value)} placeholder="e.g. TMC/2024/001" />
            </div>
            <Button type="submit" disabled={pending} className="w-full bg-emerald-700 hover:bg-emerald-800">
                {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <TicketCheck className="h-4 w-4 mr-2" />}
                Claim my sponsored seat
            </Button>
        </form>
    );
}
