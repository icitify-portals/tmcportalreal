"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { claimSponsoredSeat } from "@/lib/actions/programme-sponsorship";
import { nigerianStatesAndLgas } from "@/lib/nigeria-data";
import { countries } from "@/lib/countries";
import { Loader2, TicketCheck } from "lucide-react";

export function SponsoredClaimForm({ sponsorCode, programmeTitle }: { sponsorCode: string; programmeTitle?: string }) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [memberId, setMemberId] = useState("");
    const [gender, setGender] = useState("MALE");
    const [address, setAddress] = useState("");
    const [country, setCountry] = useState("Nigeria");
    const [state, setState] = useState("");
    const [lga, setLga] = useState("");
    const [pending, setPending] = useState(false);
    const [done, setDone] = useState<{ registrationId: string } | null>(null);
    const isNigeria = country === "Nigeria";
    const selectedStateData = nigerianStatesAndLgas.find(s => s.state === state);

    async function handleClaim(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim() || !email.trim()) return toast.error("Name and email are required");
        setPending(true);
        try {
            const res = await claimSponsoredSeat({
                sponsorCode,
                name: name.trim(),
                email: email.trim(),
                phone: phone.trim() || undefined,
                gender: gender || undefined,
                address: address.trim() || undefined,
                memberId: memberId.trim() || undefined,
                country: country.trim() || undefined,
                state: state.trim() || undefined,
                lga: lga.trim() || undefined,
            });
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
            <div>
                <Label>Gender</Label>
                <RadioGroup className="flex gap-4 mt-2" value={gender} onValueChange={setGender}>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="MALE" id="sp-male" /><Label htmlFor="sp-male">Male</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="FEMALE" id="sp-female" /><Label htmlFor="sp-female">Female</Label></div>
                </RadioGroup>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label>Country</Label>
                    <Select value={country} onValueChange={(v) => { setCountry(v); setState(""); setLga(""); }}>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Select country" /></SelectTrigger>
                        <SelectContent>
                            {countries.map(c => (
                                <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                {isNigeria ? (
                    <div>
                        <Label>State</Label>
                        <select
                            value={state}
                            onChange={(e) => { setState(e.target.value); setLga(""); }}
                            className="w-full h-9 border rounded-md px-3 text-sm"
                        >
                            <option value="">Select state…</option>
                            {nigerianStatesAndLgas.map(s => (
                                <option key={s.state} value={s.state}>{s.state}</option>
                            ))}
                        </select>
                    </div>
                ) : (
                    <div>
                        <Label>State / Province</Label>
                        <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="Enter state/province" />
                    </div>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isNigeria ? (
                    <div>
                        <Label>LGA</Label>
                        <select
                            value={lga}
                            onChange={(e) => setLga(e.target.value)}
                            disabled={!state}
                            className="w-full h-9 border rounded-md px-3 text-sm disabled:opacity-50"
                        >
                            <option value="">{state ? "Select LGA…" : "Select state first"}</option>
                            {selectedStateData?.lgas.map(l => (
                                <option key={l} value={l}>{l}</option>
                            ))}
                        </select>
                    </div>
                ) : (
                    <div>
                        <Label>City / Local Govt</Label>
                        <Input value={lga} onChange={(e) => setLga(e.target.value)} placeholder="Enter city/LGA" />
                    </div>
                )}
            </div>
            <div>
                <Label>Address (optional)</Label>
                <Textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} placeholder="Street / city" />
            </div>
            <Button type="submit" disabled={pending} className="w-full bg-emerald-700 hover:bg-emerald-800">
                {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <TicketCheck className="h-4 w-4 mr-2" />}
                Claim my sponsored seat
            </Button>
        </form>
    );
}
