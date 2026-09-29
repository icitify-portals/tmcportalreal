"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2, UserCheck } from "lucide-react";
import { updateBulkAttendee } from "@/lib/actions/programme-bulk";

/**
 * Lets the paymaster fill in / correct one bulk seat (name, contacts, member ID…).
 * Works for logged-in owners (session) and guests (paymasterEmail prop).
 * Completing a seat marks it claimed so the attendee isn't nagged afterwards.
 */
export function CompleteAttendeeDialog({
    registration,
    paymasterEmail,
    triggerLabel = "Complete",
}: {
    registration: any;
    paymasterEmail?: string;
    triggerLabel?: string;
}) {
    const [open, setOpen] = useState(false);
    const [pending, setPending] = useState(false);
    const [form, setForm] = useState({
        name: registration.name || "",
        email: registration.email || "",
        phone: registration.phone || "",
        gender: registration.gender || "MALE",
        address: registration.address || "",
        memberId: registration.memberId || "",
    });

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.name.trim() || !form.email.trim()) {
            toast.error("Name and email are required");
            return;
        }
        setPending(true);
        try {
            const res = await updateBulkAttendee({
                registrationId: registration.id,
                paymasterEmail,
                ...form,
            });
            if (res.success) {
                toast.success("Seat details saved");
                setOpen(false);
                window.location.reload();
            } else {
                toast.error(res.error || "Failed to save");
            }
        } catch {
            toast.error("An error occurred");
        } finally {
            setPending(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" title="Fill in or correct this seat as paymaster">
                    <UserCheck className="h-3 w-3 mr-1" />
                    {triggerLabel}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[440px]">
                <form onSubmit={onSubmit}>
                    <DialogHeader>
                        <DialogTitle>Complete seat details</DialogTitle>
                        <DialogDescription>
                            Fill in this seat on behalf of the attendee. Saving marks the seat as completed.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3 py-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>Full name</Label>
                                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                            </div>
                            <div>
                                <Label>Email</Label>
                                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>Phone</Label>
                                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                            </div>
                            <div>
                                <Label>Membership ID</Label>
                                <Input value={form.memberId} onChange={(e) => setForm({ ...form, memberId: e.target.value })} placeholder="e.g. TMC/2024/001" />
                            </div>
                        </div>
                        <div>
                            <Label>Gender</Label>
                            <RadioGroup className="flex gap-4 mt-2" value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                                <div className="flex items-center space-x-2"><RadioGroupItem value="MALE" id="ca-male" /><Label htmlFor="ca-male">Male</Label></div>
                                <div className="flex items-center space-x-2"><RadioGroupItem value="FEMALE" id="ca-female" /><Label htmlFor="ca-female">Female</Label></div>
                            </RadioGroup>
                        </div>
                        <div>
                            <Label>Address (optional)</Label>
                            <Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
                        <Button type="submit" disabled={pending} className="bg-emerald-700 hover:bg-emerald-800">
                            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save seat
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
