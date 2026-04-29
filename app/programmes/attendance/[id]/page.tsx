import { selfRecordAttendance } from "@/lib/actions/programmes"
import { getServerSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { CheckCircle2, XCircle, Loader2, ArrowRight, Home } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function MemberAttendancePage({ 
    params, 
    searchParams 
}: { 
    params: Promise<{ id: string }>,
    searchParams: Promise<{ token?: string }>
}) {
    const { id } = await params
    const { token } = await searchParams
    const session = await getServerSession()

    if (!session?.user) {
        // Redirect to login but keep the attendance URL for after login
        const callbackUrl = encodeURIComponent(`/programmes/attendance/${id}?token=${token}`)
        redirect(`/auth/login?callbackUrl=${callbackUrl}`)
    }

    if (!token) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl text-center space-y-6">
                    <div className="bg-red-50 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto text-red-600">
                        <XCircle className="w-12 h-12" />
                    </div>
                    <h1 className="text-2xl font-bold">Invalid Request</h1>
                    <p className="text-gray-500">Please scan the QR code displayed on the screen at the venue.</p>
                    <Button asChild className="w-full h-12 text-lg">
                        <Link href="/dashboard">Back to Dashboard</Link>
                    </Button>
                </div>
            </div>
        )
    }

    // Process attendance
    const result = await selfRecordAttendance(id, token)

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-2xl text-center space-y-8 border border-gray-100">
                
                {result.success ? (
                    <>
                        <div className="bg-green-100 p-6 rounded-full w-24 h-24 flex items-center justify-center mx-auto text-green-600 animate-bounce">
                            <CheckCircle2 className="w-16 h-16" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-3xl font-black text-gray-900">
                                {result.type === 'CHECK_IN' ? 'Check-In Successful!' : 'Check-Out Successful!'}
                            </h1>
                            <p className="text-gray-500 font-medium">
                                Your attendance has been recorded for this programme.
                            </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                            <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Time</span>
                            <span className="text-lg font-black text-gray-900">{new Date().toLocaleTimeString()}</span>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="bg-red-100 p-6 rounded-full w-24 h-24 flex items-center justify-center mx-auto text-red-600">
                            <XCircle className="w-16 h-16" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold text-gray-900">Attendance Failed</h1>
                            <p className="text-red-500 font-medium">{result.error}</p>
                        </div>
                    </>
                )}

                <div className="grid grid-cols-1 gap-3 pt-4">
                    <Button asChild variant="outline" className="h-12 text-lg font-bold border-2">
                        <Link href="/dashboard">
                            <Home className="mr-2 h-5 w-5" />
                            Go to Dashboard
                        </Link>
                    </Button>
                    <Button asChild className="h-12 text-lg font-bold bg-green-600 hover:bg-green-700 shadow-lg">
                        <Link href={`/programmes/registrations/${id}/slip`}>
                            View My Slip
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </Button>
                </div>

                <p className="text-[10px] text-gray-400 font-medium pt-4 uppercase tracking-[0.2em]">
                    The Muslim Congress • Official Attendance Portal
                </p>
            </div>
        </div>
    )
}
