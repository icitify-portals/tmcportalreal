import { ResetPasswordForm } from "@/components/auth/reset-password-form"
import { Suspense } from "react"

export const dynamic = 'force-dynamic'

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-[#166534]">
                <div className="text-white">Loading...</div>
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    )
}
