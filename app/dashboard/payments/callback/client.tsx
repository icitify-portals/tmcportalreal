"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"
import Link from "next/link"

function PaymentCallbackContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
    const [message, setMessage] = useState("")

    useEffect(() => {
        const reference = searchParams.get("reference")
        if (!reference) {
            setStatus("error")
            setMessage("No payment reference found")
            return
        }

        // Verify payment
        fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reference }),
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    setStatus("success")
                    setMessage("Payment verified successfully!")
                } else {
                    setStatus("error")
                    setMessage(data.error || "Payment verification failed")
                }
            })
            .catch((error) => {
                setStatus("error")
                setMessage("An error occurred while verifying payment")
            })
    }, [searchParams])

    return (
        <CardContent className="space-y-4">
            <div className="flex justify-center">
                {status === "loading" && <Loader2 className="h-16 w-16 animate-spin text-primary" />}
                {status === "success" && <CheckCircle2 className="h-16 w-16 text-green-500" />}
                {status === "error" && <XCircle className="h-16 w-16 text-red-500" />}
            </div>
            {message && (
                <p className="text-center text-sm text-muted-foreground">{message}</p>
            )}
            <div className="flex gap-2">
                <Button asChild className="flex-1">
                    <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
                {status === "error" && (
                    <Button variant="outline" asChild className="flex-1">
                        <Link href="/dashboard/payments">Try Again</Link>
                    </Button>
                )}
            </div>
        </CardContent>
    )
}

export default function PaymentCallbackClientPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-center">Payment Status</CardTitle>
                    <CardDescription className="text-center">
                        Verifying your payment...
                    </CardDescription>
                </CardHeader>
                <Suspense fallback={
                    <CardContent className="flex justify-center p-8">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    </CardContent>
                }>
                    <PaymentCallbackContent />
                </Suspense>
            </Card>
        </div>
    )
}
