"use client"

import { useEffect, useState } from "react"
import { Html5QrcodeScanner } from "html5-qrcode"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, XCircle, Loader2, User, Mail, CreditCard, ShieldCheck } from "lucide-react"
import { getRegistrationDetails, markAttendance } from "@/lib/actions/programmes"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ClientCurrency } from "@/components/ui/client-currency"
import { useSearchParams } from "next/navigation"

export function QRScanner({ programmeId }: { programmeId: string }) {
    const searchParams = useSearchParams()
    const [scanResult, setScanResult] = useState<string | null>(null)
    const [registration, setRegistration] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    useEffect(() => {
        const regId = searchParams.get("regId")
        if (regId) {
            handleVerify(regId)
        }

        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            false
        )

        scanner.render(onScanSuccess, onScanFailure)

        function onScanSuccess(decodedText: string) {
            let regId = decodedText
            if (decodedText.includes("regId=")) {
                const url = new URL(decodedText)
                regId = url.searchParams.get("regId") || decodedText
            } else if (decodedText.includes("/verify/")) {
                // Fallback for different URL patterns
                const parts = decodedText.split("/")
                regId = parts[parts.length - 1]
            }
            
            setScanResult(regId)
            handleVerify(regId)
            scanner.clear()
        }

        function onScanFailure(error: any) {
            // silent fail for frame scanning
        }

        return () => {
            scanner.clear().catch(e => console.error("Scanner cleanup error", e))
        }
    }, [])

    async function handleVerify(regId: string) {
        setLoading(true)
        setError(null)
        setSuccess(null)
        try {
            const details = await getRegistrationDetails(regId)
            if (!details) {
                setError("Registration not found or invalid QR code.")
                return
            }

            if (details.programmeId !== programmeId) {
                setError(`This registration is for another programme: ${details.programme?.title}`)
                return
            }

            setRegistration(details)
            
            // Auto mark attendance if paid
            if (details.status === 'PAID' || details.status === 'REGISTERED') {
                const res = await markAttendance(regId)
                if (res.success) {
                    setSuccess(`Access Granted! ${details.name} has been marked as attended.`)
                } else {
                    setError(res.error || "Failed to mark attendance.")
                }
            } else if (details.status === 'ATTENDED') {
                setSuccess(`${details.name} was already checked in.`)
            } else {
                setError("Payment is required for this registration.")
            }

        } catch (err) {
            setError("An error occurred during verification.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-2">
                <CardHeader>
                    <CardTitle className="text-lg">Scan Access Slip QR</CardTitle>
                </CardHeader>
                <CardContent>
                    <div id="reader" className="w-full overflow-hidden rounded-lg bg-gray-50 border"></div>
                    <div className="mt-4 text-center">
                        <p className="text-sm text-muted-foreground">
                            Point the camera at the QR code on the attendee's access slip.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-6">
                {loading && (
                    <div className="flex items-center justify-center p-12 bg-white rounded-lg border border-dashed">
                        <Loader2 className="w-8 h-8 animate-spin text-green-700" />
                        <span className="ml-3 font-medium">Verifying Registration...</span>
                    </div>
                )}

                {success && (
                    <Alert className="bg-green-50 border-green-200 text-green-800">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertTitle className="font-bold">Access Granted</AlertTitle>
                        <AlertDescription>{success}</AlertDescription>
                    </Alert>
                )}

                {error && (
                    <Alert variant="destructive" className="bg-red-50 border-red-200">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <AlertTitle>Verification Failed</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {registration && (
                    <Card className="shadow-lg border-2">
                        <CardHeader className="bg-gray-50 border-b">
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">Attendee Details</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex justify-center mb-4">
                                <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-green-100 shadow-inner bg-gray-50 flex items-center justify-center">
                                    {registration.user?.image ? (
                                        <img src={registration.user.image} alt={registration.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-16 h-16 text-gray-300" />
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-3 bg-white rounded-xl border border-gray-100">
                                <div className="bg-green-50 p-2 rounded-full">
                                    <User className="w-5 h-5 text-green-700" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Name</p>
                                    <p className="font-bold text-gray-900">{registration.name}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-3 bg-white rounded-xl border border-gray-100">
                                <div className="bg-blue-50 p-2 rounded-full">
                                    <ShieldCheck className="w-5 h-5 text-blue-700" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Membership ID</p>
                                    <p className="font-bold text-gray-900">{registration.member?.memberId || "Guest Attendee"}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-3 bg-white rounded-xl border border-gray-100">
                                <div className="bg-orange-50 p-2 rounded-full">
                                    <Mail className="w-5 h-5 text-orange-700" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Email</p>
                                    <p className="font-medium text-gray-700">{registration.email}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                <div className="flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-gray-400" />
                                    <ClientCurrency amount={parseFloat(registration.amountPaid || "0")} className="font-bold text-gray-900" />
                                </div>
                                <Badge variant={registration.status === 'PAID' || registration.status === 'ATTENDED' ? 'default' : 'destructive'}>
                                    {registration.status}
                                </Badge>
                            </div>

                            <Button 
                                variant="outline" 
                                className="w-full mt-4"
                                onClick={() => {
                                    setRegistration(null)
                                    setSuccess(null)
                                    setError(null)
                                    window.location.reload() // restart scanner
                                }}
                            >
                                Reset Scanner
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
