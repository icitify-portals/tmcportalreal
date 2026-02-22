"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

import Image from "next/image"

export function SignInForm() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            })

            if (result?.error) {
                // NextAuth wraps thrown errors in a 'CredentialsSignin' or similar string sometimes, 
                // but usually the raw message is available if properly handled.
                // In v5/beta, it might be in different places.
                const errorMessage = result.error.includes("CredentialsSignin")
                    ? "Invalid email or password"
                    : result.error;

                toast.error(errorMessage)
            } else {
                toast.success("Signed in successfully")
                router.push("/dashboard")
                router.refresh()
            }
        } catch (error) {
            toast.error("An error occurred. Please try again.")
        } finally {
            setIsLoading(false)
        }
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
                    <CardTitle className="text-2xl font-bold text-white">TMC Connect</CardTitle>
                    <CardDescription className="text-green-200">Sign in to your account</CardDescription>
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
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-white">Password</Label>
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
                        <Button
                            type="submit"
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                            disabled={isLoading}
                        >
                            {isLoading ? "Signing in..." : "Sign In"}
                        </Button>
                        <p className="text-center text-sm text-green-200">
                            Don't have an account?{" "}
                            <a href="/auth/signup" className="text-white hover:underline font-medium">
                                Sign up
                            </a>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
