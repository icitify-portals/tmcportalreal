"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react"
import Link from "next/link"

export function VerifyEmailContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [status, setStatus] = useState<"loading" | "success" | "error" | "pending">("loading")
    const [message, setMessage] = useState("")
    const token = searchParams.get("token")
    const email = searchParams.get("email")

    useEffect(() => {
        if (token && email) {
            verifyEmail(token, email)
        } else {
            setStatus("pending")
            setMessage("Please check your email for the verification link.")
        }
    }, [token, email])

    const verifyEmail = async (token: string, email: string) => {
        try {
            const response = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`, {
                method: "GET",
            })

            const data = await response.json()

            if (response.ok) {
                setStatus("success")
                setMessage("Email verified successfully! You can now sign in.")
                setTimeout(() => {
                    router.push("/auth/signin")
                }, 3000)
            } else {
                setStatus("error")
                setMessage(data.error || "Verification failed")
            }
        } catch (error) {
            setStatus("error")
            setMessage("An error occurred during verification")
        }
    }

    const resendVerification = async () => {
        if (!email) return

        try {
            const response = await fetch("/api/auth/resend-verification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            })

            const data = await response.json()

            if (response.ok) {
                setMessage("Verification email sent! Please check your inbox.")
            } else {
                setMessage(data.error || "Failed to resend verification email")
            }
        } catch (error) {
            setMessage("An error occurred")
        }
    }

    return (
        <CardContent className="space-y-4">
            <div className="flex justify-center">
                {status === "loading" && <Loader2 className="h-16 w-16 animate-spin text-green-500" />}
                {status === "success" && <CheckCircle2 className="h-16 w-16 text-green-500" />}
                {status === "error" && <XCircle className="h-16 w-16 text-red-500" />}
                {status === "pending" && <Mail className="h-16 w-16 text-yellow-500" />}
            </div>

            <p className="text-center text-green-200">{message}</p>

            {(status === "error" || status === "pending") && email && (
                <Button
                    onClick={resendVerification}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                    Resend Verification Email
                </Button>
            )}

            <div className="text-center">
                <Link href="/auth/signin" className="text-green-300 hover:text-white text-sm">
                    Back to Sign In
                </Link>
            </div>
        </CardContent>
    )
}
