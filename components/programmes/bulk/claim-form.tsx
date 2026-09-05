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

export function ClaimForm({ token, registration, programme }: { token: string; registration: any; programme: any }) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [data, setData] = useState({
        name: registration.name,
        email: registration.email,
        phone: registration.phone || "",
        gender: registration.gender || "MALE",
        address: registration.address || "",
    });

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
                    <div><Label>Address (optional)</Label><Textarea value={data.address} onChange={(e) => setData({ ...data, address: e.target.value })} rows={2} /></div>
                    <Button type="submit" disabled={pending} className="w-full bg-emerald-700 hover:bg-emerald-800">
                        {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                        Confirm my seat
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
