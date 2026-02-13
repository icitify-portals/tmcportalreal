"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { countries, getDefaultCountry } from "@/lib/countries"
import { calculatePasswordStrength, getPasswordStrengthColor, getPasswordStrengthLabel } from "@/lib/password-strength"
import { Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react"
import Image from "next/image"

export function SignUpForm() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const [formData, setFormData] = useState({
        surname: "",
        otherNames: "",
        email: "",
        country: getDefaultCountry().code,
        phonePrefix: getDefaultCountry().phonePrefix,
        phoneNumber: "",
        address: "",
        password: "",
        confirmPassword: "",
    })

    const [passwordStrength, setPasswordStrength] = useState({
        percentage: 0,
        requirements: {
            length: false,
            uppercase: false,
            lowercase: false,
            number: false,
            specialChar: false,
        },
        isValid: false,
    })

    const selectedCountry = countries.find((c) => c.code === formData.country) || getDefaultCountry()

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }))

        if (field === "password") {
            const strength = calculatePasswordStrength(value)
            setPasswordStrength(strength)
        }
    }

    const handleCountryChange = (countryCode: string) => {
        const country = countries.find((c) => c.code === countryCode) || getDefaultCountry()
        setFormData((prev) => ({
            ...prev,
            country: country.code,
            phonePrefix: country.phonePrefix,
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        // Validation
        if (!passwordStrength.isValid) {
            toast.error("Password does not meet requirements. Strength must be at least 70%.")
            setIsLoading(false)
            return
        }

        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords do not match")
            setIsLoading(false)
            return
        }

        try {
            const response = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    surname: formData.surname,
                    otherNames: formData.otherNames,
                    email: formData.email,
                    country: formData.country,
                    phone: `${formData.phonePrefix}${formData.phoneNumber}`,
                    address: formData.address,
                    password: formData.password,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                toast.error(data.error || "Signup failed")
                return
            }

            toast.success("Account created! Please check your email to verify your account.")
            setTimeout(() => {
                router.push("/auth/verify-email?email=" + encodeURIComponent(formData.email))
            }, 1000)
        } catch (error: any) {
            toast.error(error.message || "An error occurred. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#166534] flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl bg-[#166534] border-green-700">
                <CardHeader className="flex flex-col items-center">
                    <div className="w-20 h-20 relative mb-4">
                        <Image
                            src="/images/logo.png"
                            alt="TMC Logo"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                    <CardTitle className="text-3xl text-white">Create an account</CardTitle>
                    <CardDescription className="text-green-200">
                        Enter your details to get started.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="surname" className="text-white">Surname</Label>
                                <Input
                                    id="surname"
                                    value={formData.surname}
                                    onChange={(e) => handleInputChange("surname", e.target.value)}
                                    required
                                    disabled={isLoading}
                                    className="bg-green-800 border-green-600 text-white placeholder:text-green-400"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="otherNames" className="text-white">Other Names</Label>
                                <Input
                                    id="otherNames"
                                    value={formData.otherNames}
                                    onChange={(e) => handleInputChange("otherNames", e.target.value)}
                                    required
                                    disabled={isLoading}
                                    className="bg-green-800 border-green-600 text-white placeholder:text-green-400"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-white">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleInputChange("email", e.target.value)}
                                required
                                disabled={isLoading}
                                className="bg-green-800 border-green-600 text-white placeholder:text-green-400"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="country" className="text-white">Country</Label>
                            <Select
                                value={formData.country}
                                onValueChange={handleCountryChange}
                                disabled={isLoading}
                            >
                                <SelectTrigger className="bg-green-800 border-green-600 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-green-800 border-green-600">
                                    {countries.map((country) => (
                                        <SelectItem
                                            key={country.code}
                                            value={country.code}
                                            className="text-white hover:bg-green-700"
                                        >
                                            {country.name} ({country.phonePrefix})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-white">Phone Number</Label>
                            <div className="flex gap-2">
                                <div className="w-24">
                                    <Input
                                        value={formData.phonePrefix}
                                        readOnly
                                        className="bg-green-800 border-green-600 text-white text-center"
                                    />
                                </div>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={formData.phoneNumber}
                                    onChange={(e) => handleInputChange("phoneNumber", e.target.value.replace(/\D/g, ""))}
                                    required
                                    disabled={isLoading}
                                    className="flex-1 bg-green-800 border-green-600 text-white placeholder:text-green-400"
                                    placeholder="1234567890"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address" className="text-white">Address</Label>
                            <Input
                                id="address"
                                value={formData.address}
                                onChange={(e) => handleInputChange("address", e.target.value)}
                                required
                                disabled={isLoading}
                                className="bg-green-800 border-green-600 text-white placeholder:text-green-400"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-white">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={(e) => handleInputChange("password", e.target.value)}
                                    required
                                    disabled={isLoading}
                                    className="bg-green-800 border-green-600 text-white placeholder:text-green-400 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-green-300 hover:text-white"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>

                            {formData.password && (
                                <div className="mt-2 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className={`text-sm ${getPasswordStrengthColor(passwordStrength.percentage)}`}>
                                            Strength: {passwordStrength.percentage}% - {getPasswordStrengthLabel(passwordStrength.percentage)}
                                        </span>
                                        <div className="w-32 h-2 bg-green-900 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all ${passwordStrength.percentage >= 70
                                                    ? "bg-green-500"
                                                    : passwordStrength.percentage >= 50
                                                        ? "bg-yellow-500"
                                                        : "bg-red-500"
                                                    }`}
                                                style={{ width: `${passwordStrength.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1 text-sm">
                                        <div className="flex items-center gap-2">
                                            {passwordStrength.requirements.length ? (
                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <XCircle className="h-4 w-4 text-red-500" />
                                            )}
                                            <span className={passwordStrength.requirements.length ? "text-green-400" : "text-red-400"}>
                                                At least 8 characters
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {passwordStrength.requirements.uppercase ? (
                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <XCircle className="h-4 w-4 text-red-500" />
                                            )}
                                            <span className={passwordStrength.requirements.uppercase ? "text-green-400" : "text-red-400"}>
                                                One uppercase letter
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {passwordStrength.requirements.lowercase ? (
                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <XCircle className="h-4 w-4 text-red-500" />
                                            )}
                                            <span className={passwordStrength.requirements.lowercase ? "text-green-400" : "text-red-400"}>
                                                One lowercase letter
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {passwordStrength.requirements.number ? (
                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <XCircle className="h-4 w-4 text-red-500" />
                                            )}
                                            <span className={passwordStrength.requirements.number ? "text-green-400" : "text-red-400"}>
                                                One number
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {passwordStrength.requirements.specialChar ? (
                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <XCircle className="h-4 w-4 text-red-500" />
                                            )}
                                            <span className={passwordStrength.requirements.specialChar ? "text-green-400" : "text-red-400"}>
                                                One special character
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={formData.confirmPassword}
                                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                                    required
                                    disabled={isLoading}
                                    className="bg-green-800 border-green-600 text-white placeholder:text-green-400 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-green-300 hover:text-white"
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                <p className="text-sm text-red-400">Passwords do not match</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                            disabled={isLoading || !passwordStrength.isValid}
                        >
                            {isLoading ? "Creating account..." : "Create Account"}
                        </Button>

                        <p className="text-center text-sm text-green-200">
                            Already have an account?{" "}
                            <a href="/auth/signin" className="text-white hover:underline font-medium">
                                Sign in
                            </a>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
