"use client"

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
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { boolean } from "zod"
import { createBudget } from "@/lib/actions/finance"

export function CreateBudgetDialog({ organizationId }: { organizationId: string }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [title, setTitle] = useState("")
    const [year, setYear] = useState(new Date().getFullYear())
    const [items, setItems] = useState<{ category: string, description: string, amount: string }[]>([
        { category: "", description: "", amount: "" }
    ])

    const addItem = () => {
        setItems([...items, { category: "", description: "", amount: "" }])
    }

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index))
    }

    const updateItem = (index: number, field: string, value: string) => {
        const newItems = [...items]
        // @ts-ignore
        newItems[index][field] = value
        setItems(newItems)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const budgetItems = items.map(item => ({
                category: item.category,
                description: item.description,
                amount: parseFloat(item.amount)
            }))

            const res = await createBudget({
                year,
                title,
                items: budgetItems
            }, organizationId)

            if (res.success) {
                toast.success("Budget created successfully")
                setOpen(false)
                setTitle("")
                setItems([{ category: "", description: "", amount: "" }])
            } else {
                toast.error(res.error || "Failed to create budget")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Create Budget</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Budget</DialogTitle>
                    <DialogDescription>
                        Plan your financial year. Add line items for expected expenses.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="year">Year</Label>
                            <Input
                                id="year"
                                type="number"
                                value={year}
                                onChange={(e) => setYear(parseInt(e.target.value))}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="title">Budget Title</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. 2026 Annual Budget"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <Label>Budget Items</Label>
                            <Button type="button" variant="outline" size="sm" onClick={addItem}>
                                <Plus className="h-4 w-4 mr-2" /> Add Item
                            </Button>
                        </div>

                        {items.map((item, index) => (
                            <div key={index} className="flex gap-2 items-end border p-2 rounded-md">
                                <div className="space-y-1 flex-1">
                                    <Label className="text-xs">Category</Label>
                                    <Input
                                        value={item.category}
                                        onChange={(e) => updateItem(index, 'category', e.target.value)}
                                        placeholder="e.g. Logistics"
                                        required
                                    />
                                </div>
                                <div className="space-y-1 flex-[2]">
                                    <Label className="text-xs">Description</Label>
                                    <Input
                                        value={item.description}
                                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                                        placeholder="Item details"
                                        required
                                    />
                                </div>
                                <div className="space-y-1 flex-1">
                                    <Label className="text-xs">Amount</Label>
                                    <Input
                                        type="number"
                                        value={item.amount}
                                        onChange={(e) => updateItem(index, 'amount', e.target.value)}
                                        required
                                    />
                                </div>
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        ))}
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Creating..." : "Submit Budget"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
