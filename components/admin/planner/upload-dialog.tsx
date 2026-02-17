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
import { useState } from "react"
import { toast } from "sonner"
import { uploadYearPlanner } from "@/lib/actions/planner"
import { Upload } from "lucide-react"

export function UploadPlannerDialog() {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)

        const formData = new FormData(event.currentTarget)
        const res = await uploadYearPlanner(formData)

        setIsLoading(false)

        if (res.success) {
            toast.success(`Successfully imported ${res.count} programmes`)
            setOpen(false)
        } else {
            toast.error(res.error || "Failed to upload planner")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Import Excel</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={onSubmit}>
                    <DialogHeader>
                        <DialogTitle>Import Year Planner</DialogTitle>
                        <DialogDescription>
                            Upload an Excel file (.xlsx) containing the year planner.
                            Ensure columns match the template: OFFICE, PROGRAM AND ACTIVITY, FORMAT, FREQUENCY, etc.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="file" className="text-right">
                                Excel File
                            </Label>
                            <Input
                                id="file"
                                name="file"
                                type="file"
                                accept=".xlsx, .xls"
                                className="col-span-3"
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Importing..." : "Import"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
