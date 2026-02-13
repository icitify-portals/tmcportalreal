"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { saveNavigationItem } from "@/lib/actions/navigation"
import { toast } from "sonner"
import { Plus } from "lucide-react"

interface MenuItemFormProps {
    existingItem?: any
    trigger?: React.ReactNode
    onSuccess?: () => void
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function MenuItemForm({ existingItem, trigger, onSuccess, open: constrainedOpen, onOpenChange }: MenuItemFormProps) {
    const [open, setOpen] = useState(false)
    const [label, setLabel] = useState("")
    const [path, setPath] = useState("")
    const [type, setType] = useState("link")
    const [loading, setLoading] = useState(false)

    const isControlled = typeof constrainedOpen !== "undefined"
    const isOpen = isControlled ? constrainedOpen : open
    const setIsOpen = (val: boolean) => {
        if (isControlled) onOpenChange?.(val)
        else setOpen(val)
    }

    useEffect(() => {
        if (existingItem) {
            setLabel(existingItem.label)
            setPath(existingItem.path || "")
            setType(existingItem.type)
        } else {
            setLabel("")
            setPath("")
            setType("link")
        }
    }, [existingItem, isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const res = await saveNavigationItem({
            id: existingItem?.id,
            label,
            path: type === "link" ? path : undefined,
            type: type as "link" | "dropdown" | "button",
            order: existingItem?.order ? parseInt(String(existingItem.order)) : 0,
            parentId: existingItem?.parentId || undefined
        } as any)

        if (res.success) {
            toast.success(existingItem ? "Item updated" : "Item created")
            setIsOpen(false)
            onSuccess?.()
        } else {
            toast.error(res.error)
        }
        setLoading(false)
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{existingItem ? "Edit Menu Item" : "Add Menu Item"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Label</Label>
                        <Input placeholder="Home, About, etc." value={label} onChange={e => setLabel(e.target.value)} required />
                    </div>

                    <div className="space-y-2">
                        <Label>Type</Label>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="link">Link</SelectItem>
                                <SelectItem value="dropdown">Dropdown (Parent)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {type === "link" && (
                        <div className="space-y-2">
                            <Label>URL Path</Label>
                            <Input placeholder="/about, /donate" value={path} onChange={e => setPath(e.target.value)} required />
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : "Save"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
