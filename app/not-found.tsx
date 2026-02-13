import Link from 'next/link'
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export const dynamic = 'force-dynamic'

export default function NotFound() {
    return (
        <DashboardLayout>
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <h2 className="text-2xl font-bold">Not Found</h2>
                <p className="text-muted-foreground">Could not find requested resource</p>
                <Link
                    href="/dashboard"
                    className="text-blue-600 hover:underline"
                >
                    Return Home
                </Link>
            </div>
        </DashboardLayout>
    )
}
