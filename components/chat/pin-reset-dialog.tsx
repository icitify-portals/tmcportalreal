"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, KeyRound } from "lucide-react"
import * as cryptoLib from "@/lib/crypto"
import { toast } from "sonner"

interface PinResetDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    userKeys: any // keys from server
    onSuccess: () => void
}

export function PinResetDialog({ open, onOpenChange, userKeys, onSuccess }: PinResetDialogProps) {
    const [recoveryKey, setRecoveryKey] = useState("")
    const [newPin, setNewPin] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleReset = async () => {
        setIsLoading(true)
        try {
            if (!userKeys || !userKeys.encryptedPrivateKeyRecovery || !userKeys.salt) {
                toast.error("Recovery is not available for this account.")
                return
            }

            // 1. Derive Key from Recovery Code
            const recoveryPinKey = await cryptoLib.deriveKeyFromText(recoveryKey, userKeys.salt)

            // 2. Decrypt Private Key
            let privateKeyBase64: string
            try {
                privateKeyBase64 = await cryptoLib.decryptPrivateKey(userKeys.encryptedPrivateKeyRecovery, recoveryPinKey)
            } catch (e) {
                toast.error("Invalid Recovery Key")
                setIsLoading(false)
                return
            }

            // 3. Encrypt with New PIN
            const pinKey = await cryptoLib.deriveKeyFromText(newPin, userKeys.salt)
            const encryptedPrivateKey = await cryptoLib.encryptPrivateKey(privateKeyBase64, pinKey)

            // 4. Update Server
            const res = await fetch("/api/auth/keys", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...userKeys, // Keep public key etc same
                    encryptedPrivateKey,
                    // We don't change recovery key here, just the PIN protection
                })
            })

            if (res.ok) {
                toast.success("PIN Reset Successfully")
                onSuccess()
                onOpenChange(false)
            } else {
                throw new Error("Failed to update keys")
            }

        } catch (error) {
            console.error(error)
            toast.error("Failed to reset PIN")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reset Chat PIN</DialogTitle>
                    <DialogDescription>
                        Enter your Recovery Key to reset your PIN.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Recovery Key</Label>
                        <Input
                            value={recoveryKey}
                            onChange={e => setRecoveryKey(e.target.value)}
                            placeholder="Paste your 32-character key"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>New PIN</Label>
                        <Input
                            type="password"
                            value={newPin}
                            onChange={e => setNewPin(e.target.value)}
                            placeholder="New secure PIN"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleReset} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Reset PIN
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
