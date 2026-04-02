"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import Image from "next/image"
import Link from "next/link"

export function ResetPasswordForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [token, setToken] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        const t = searchParams.get("token")
        const e = searchParams.get("email")
        if (t) setToken(t)
        if (e) setEmail(e)
    }, [searchParams])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!token || !email) {
            toast.error("Invalid or missing reset token. Please request a new link.")
            return
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match")
            return
        }

        if (password.length < 8) {
            toast.error("Password must be at least 8 characters")
            return
        }

        setIsLoading(true)

        try {
            const response = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, token, password }),
            })

            const data = await response.json()

            if (response.ok) {
                toast.success("Password reset successful!")
                router.push("/auth/signin")
            } else {
                toast.error(data.error || "Something went wrong")
            }
        } catch (error) {
            toast.error("An error occurred. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    if (!token || !email) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#166534] p-4">
                <Card className="w-full max-w-md bg-[#166534] border-green-700">
                    <CardHeader className="space-y-1 flex flex-col items-center">
                        <CardTitle className="text-2xl font-bold text-white">Invalid Link</CardTitle>
                        <CardDescription className="text-green-200">
                            The password reset link is invalid or has expired.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center">
                        <Button asChild className="bg-green-600 hover:bg-green-700">
                            <Link href="/auth/forgot-password">Request New Link</Link>
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
                    <CardTitle className="text-2xl font-bold text-white">Set New Password</CardTitle>
                    <CardDescription className="text-green-200">Enter your new password below</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-white">New Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                                className="bg-green-800 border-green-600 text-white placeholder:text-green-400"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-white">Confirm New Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
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
                            {isLoading ? "Resetting..." : "Reset Password"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
