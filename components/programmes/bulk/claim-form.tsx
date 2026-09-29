"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle } from "lucide-react";
import { claimBulkSeat } from "@/lib/actions/programme-bulk";
import { nigerianStatesAndLgas } from "@/lib/nigeria-data";
import { countries } from "@/lib/countries";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ClaimForm({ token, registration, programme }: { token: string; registration: any; programme: any }) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [data, setData] = useState({
        name: registration.name,
        email: registration.email,
        phone: registration.phone || "",
        gender: registration.gender || "MALE",
        address: registration.address || "",
        memberId: registration.memberId || "",
        country: registration.country || "Nigeria",
        state: registration.state || "",
        lga: registration.lga || "",
    });
    const isNigeria = data.country === "Nigeria";
    const selectedStateData = nigerianStatesAndLgas.find(s => s.state === data.state);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        startTransition(async () => {
            const res: any = await claimBulkSeat({ token, ...data });
            if (res.success) {
                toast.success("Your seat is confirmed");
                router.refresh();
            } else toast.error(res.error || "Failed");
        });
    }

    return (
        <Card>
            <CardContent className="p-6">
                <div className="text-sm text-muted-foreground mb-4">
                    Programme: <b>{programme?.title}</b> · {programme?.venue} · {new Date(programme?.startDate).toLocaleDateString()}
                </div>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><Label>Full name</Label><Input value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} required /></div>
                        <div><Label>Email</Label><Input type="email" value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} required /></div>
                        <div><Label>Phone</Label><Input value={data.phone} onChange={(e) => setData({ ...data, phone: e.target.value })} /></div>
                        <div>
                            <Label>Gender</Label>
                            <RadioGroup className="flex gap-4 mt-2" value={data.gender} onValueChange={(v) => setData({ ...data, gender: v })}>
                                <div className="flex items-center space-x-2"><RadioGroupItem value="MALE" id="male" /><Label htmlFor="male">Male</Label></div>
                                <div className="flex items-center space-x-2"><RadioGroupItem value="FEMALE" id="female" /><Label htmlFor="female">Female</Label></div>
                            </RadioGroup>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label>Country</Label>
                            <Select value={data.country} onValueChange={(v) => setData({ ...data, country: v, state: "", lga: "" })}>
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
                                    value={data.state}
                                    onChange={(e) => setData({ ...data, state: e.target.value, lga: "" })}
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
                                <Input value={data.state} onChange={(e) => setData({ ...data, state: e.target.value })} placeholder="Enter state/province" />
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {isNigeria ? (
                            <div>
                                <Label>LGA</Label>
                                <select
                                    value={data.lga}
                                    onChange={(e) => setData({ ...data, lga: e.target.value })}
                                    disabled={!data.state}
                                    className="w-full h-9 border rounded-md px-3 text-sm disabled:opacity-50"
                                >
                                    <option value="">{data.state ? "Select LGA…" : "Select state first"}</option>
                                    {selectedStateData?.lgas.map(lga => (
                                        <option key={lga} value={lga}>{lga}</option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div>
                                <Label>City / Local Govt</Label>
                                <Input value={data.lga} onChange={(e) => setData({ ...data, lga: e.target.value })} placeholder="Enter city/LGA" />
                            </div>
                        )}
                    </div>
                    <div><Label>Address (optional)</Label><Textarea value={data.address} onChange={(e) => setData({ ...data, address: e.target.value })} rows={2} /></div>
                    <div><Label>Membership ID (optional — links this seat to your TMC membership)</Label><Input value={data.memberId} onChange={(e) => setData({ ...data, memberId: e.target.value })} placeholder="e.g. TMC/2024/001" /></div>
                    <Button type="submit" disabled={pending} className="w-full bg-emerald-700 hover:bg-emerald-800">
                        {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                        Confirm my seat
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
