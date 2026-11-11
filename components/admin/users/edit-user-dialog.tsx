"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { updateUserRecord } from "@/lib/actions/users"
import { toast } from "sonner"
import { Edit2, Loader2, CheckCircle2, AlertCircle } from "lucide-react"

interface EditUserDialogProps {
    user: {
        id: string
        name: string | null
        email: string
        phone?: string | null
        emailVerified?: Date | string | null
        address?: string | null
    }
}

export function EditUserDialog({ user }: EditUserDialogProps) {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState(user.name || "")
    const [email, setEmail] = useState(user.email || "")
    const [phone, setPhone] = useState(user.phone || "")
    const [address, setAddress] = useState(user.address || "")
    const [isEmailVerified, setIsEmailVerified] = useState(!!user.emailVerified)
    const [isLoading, setIsLoading] = useState(false)

    // Reset fields when opening dialog
    const handleOpenChange = (isOpen: boolean) => {
        if (isOpen) {
            setName(user.name || "")
            setEmail(user.email || "")
            setPhone(user.phone || "")
            setAddress(user.address || "")
            setIsEmailVerified(!!user.emailVerified)
        }
        setOpen(isOpen)
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault()

        if (!name.trim() || name.trim().length < 2) {
            toast.error("Name must be at least 2 characters long")
            return
        }

        if (!email.trim() || !email.includes("@")) {
            toast.error("Please enter a valid email address")
            return
        }

        setIsLoading(true)
        try {
            const res = await updateUserRecord(user.id, {
                name: name.trim(),
                email: email.trim(),
                phone: phone.trim(),
                address: address.trim(),
                isEmailVerified,
            })

            if (res.success) {
                toast.success("User record updated successfully")
                setOpen(false)
            } else {
                toast.error(res.error || "Failed to update user record")
            }
        } catch (error: any) {
            toast.error(error.message || "An unexpected error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 px-2 text-xs text-green-800 border-green-300 hover:bg-green-50">
                    <Edit2 className="h-3.5 w-3.5 mr-1" />
                    Edit
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
                <form onSubmit={handleSave}>
                    <DialogHeader>
                        <DialogTitle>Edit User Profile</DialogTitle>
                        <DialogDescription>
                            Update basic user credentials, contact information, and verification status.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="user-name" className="text-xs font-semibold">Full Name</Label>
                            <Input
                                id="user-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Full Name"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="user-email" className="text-xs font-semibold">Email Address</Label>
                            <Input
                                id="user-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="user@example.com"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="user-phone" className="text-xs font-semibold">Phone Number</Label>
                            <Input
                                id="user-phone"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+234..."
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="user-address" className="text-xs font-semibold">Residential Address</Label>
                            <Input
                                id="user-address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="Street, City, State"
                            />
                        </div>

                        <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/40">
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                    <Label className="text-xs font-semibold cursor-pointer" htmlFor="email-verified-toggle">
                                        Email Verification
                                    </Label>
                                    {isEmailVerified ? (
                                        <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-[10px] px-1.5 py-0">
                                            <CheckCircle2 className="h-3 w-3 mr-0.5 inline" /> Verified
                                        </Badge>
                                    ) : (
                                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                            <AlertCircle className="h-3 w-3 mr-0.5 inline" /> Unverified
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-[11px] text-muted-foreground">
                                    Enables immediate login access for unverified accounts.
                                </p>
                            </div>
                            <Switch
                                id="email-verified-toggle"
                                checked={isEmailVerified}
                                onCheckedChange={setIsEmailVerified}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading} className="bg-green-700 hover:bg-green-800 text-white">
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
