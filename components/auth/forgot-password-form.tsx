"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import Image from "next/image"
import Link from "next/link"

export function ForgotPasswordForm() {
    const [email, setEmail] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const response = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            })

            const data = await response.json()

            if (response.ok) {
                toast.success(data.message || "Reset link sent successfully")
                setIsSubmitted(true)
            } else {
                toast.error(data.error || "Something went wrong")
            }
        } catch (error) {
            toast.error("An error occurred. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    if (isSubmitted) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#166534] p-4">
                <Card className="w-full max-w-md bg-[#166534] border-green-700">
                    <CardHeader className="space-y-1 flex flex-col items-center">
                        <div className="w-20 h-20 relative mb-2">
                            <Image
                                src="/images/logo.png"
                                alt="TMC Logo"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                        <CardTitle className="text-2xl font-bold text-white">Check your email</CardTitle>
                        <CardDescription className="text-green-200 text-center">
                            We've sent a password reset link to <strong>{email}</strong>.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center space-y-4">
                        <p className="text-sm text-green-200 text-center">
                            Didn't receive the email? Check your spam folder or try again.
                        </p>
                        <Button asChild variant="outline" className="text-white border-green-600 hover:bg-green-800">
                            <Link href="/auth/signin">Back to Login</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#166534] p-4">
            <Card className="w-full max-w-md bg-[#166534] border-green-700">
                <CardHeader className="space-y-1 flex flex-col items-center">
                    <div className="w-20 h-20 relative mb-2">
                        <Image
                            src="/images/logo.png"
                            alt="TMC Logo"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                    <CardTitle className="text-2xl font-bold text-white">Reset Password</CardTitle>
                    <CardDescription className="text-green-200">Enter your email to receive a reset link</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-white">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                                className="bg-green-800 border-green-600 text-white placeholder:text-green-400"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                            disabled={isLoading}
                        >
                            {isLoading ? "Sending link..." : "Send Reset Link"}
                        </Button>
                        <p className="text-center text-sm text-green-200">
                            Remembered your password?{" "}
                            <Link href="/auth/signin" className="text-white hover:underline font-medium">
                                Back to login
                            </Link>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
