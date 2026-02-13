export const dynamic = 'force-dynamic'

import { BurialRequestForm } from "@/components/burial/burial-request-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export default function NewBurialRequestPage() {
    return (
        <div className="container mx-auto py-8 space-y-8 max-w-3xl">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/burial">
                    <Button variant="ghost" size="icon">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">New Burial Request</h1>
                    <p className="text-muted-foreground">Please fill in the details of the deceased.</p>
                </div>
            </div>

            <BurialRequestForm />
        </div>
    )
}
