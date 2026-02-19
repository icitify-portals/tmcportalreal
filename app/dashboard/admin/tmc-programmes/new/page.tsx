import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BookOpen } from "lucide-react"
import Link from "next/link"
import { TmcProgrammeForm } from "../tmc-programme-form"

export default function NewTmcProgrammePage() {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/admin/tmc-programmes">
                        <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <BookOpen className="h-6 w-6 text-primary" />
                            Add New Programme
                        </h1>
                        <p className="text-sm text-muted-foreground">Create a new TMC programme entry</p>
                    </div>
                </div>
                <TmcProgrammeForm mode="create" />
            </div>
        </DashboardLayout>
    )
}
