import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Building2 } from "lucide-react"
import Link from "next/link"
import { OrganForm } from "../organ-form"

export default function NewOrganPage() {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/admin/organs">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Building2 className="h-6 w-6 text-primary" />
                            Add New Organ
                        </h1>
                        <p className="text-sm text-muted-foreground">Create a new TMC institutional organ entry</p>
                    </div>
                </div>

                <OrganForm mode="create" />
            </div>
        </DashboardLayout>
    )
}
