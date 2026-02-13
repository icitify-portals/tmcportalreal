import MessagesClientPage from "./client"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export const dynamic = "force-dynamic"

export default function MessagesPage() {
    return (
        <DashboardLayout>
            <MessagesClientPage />
        </DashboardLayout>
    )
}
