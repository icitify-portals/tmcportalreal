import { getRegistrationDetails, generateSecurityHash } from "@/lib/actions/programmes"
import { notFound } from "next/navigation"
import Image from "next/image"
import { CheckCircle2, XCircle, ShieldCheck, User, Calendar, MapPin, BadgeCheck } from "lucide-react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"

export default async function PublicVerifyPage({ 
    params, 
    searchParams 
}: { 
    params: Promise<{ id: string }>,
    searchParams: Promise<{ hash?: string }>
}) {
    const { id } = await params
    const { hash } = await searchParams

    const registration = await getRegistrationDetails(id)
    if (!registration) return notFound()

    // Verify Hash
    const expectedHash = await generateSecurityHash(registration.id, registration.email)
    const isValid = hash === expectedHash

    const isPaid = registration.status === 'PAID' || registration.status === 'ATTENDED'

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
                {/* Status Header */}
                <div className={`p-8 text-center ${isValid && isPaid ? 'bg-green-600' : 'bg-red-600'} text-white`}>
                    <div className="flex justify-center mb-4">
                        {isValid && isPaid ? (
                            <div className="bg-white/20 p-3 rounded-full backdrop-blur-md">
                                <BadgeCheck className="w-12 h-12" />
                            </div>
                        ) : (
                            <div className="bg-white/20 p-3 rounded-full backdrop-blur-md">
                                <XCircle className="w-12 h-12" />
                            </div>
                        )}
                    </div>
                    <h1 className="text-2xl font-bold uppercase tracking-tight">
                        {isValid && isPaid ? 'Entry Verified' : !isValid ? 'Invalid Slip' : 'Payment Required'}
                    </h1>
                    <p className="text-white/80 text-sm mt-1">
                        TMC Programme Access Control
                    </p>
                </div>

                {/* Attendee Details */}
                <div className="p-8 space-y-6">
                    <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
                        <div className="w-20 h-20 bg-gray-100 rounded-2xl overflow-hidden border-2 border-gray-200 flex-shrink-0 flex items-center justify-center">
                            {registration.user?.image ? (
                                <Image src={registration.user.image} alt="User" width={80} height={80} className="object-cover" />
                            ) : (
                                <User className="w-10 h-10 text-gray-300" />
                            )}
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Attendee</p>
                            <h2 className="text-xl font-bold text-gray-900 leading-tight">{registration.name}</h2>
                            <p className="text-sm text-gray-500 font-medium">{registration.member?.memberId || "Guest Attendee"}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <ShieldCheck className="w-5 h-5 text-green-600 mt-0.5" />
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Programme</p>
                                <p className="font-semibold text-gray-800 text-sm">{registration.programme.title}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Venue</p>
                                <p className="text-sm text-gray-600">{registration.programme.venue}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date & Time</p>
                                <p className="text-sm text-gray-600">
                                    {format(new Date(registration.programme.startDate), "EEE, MMM d, yyyy")}
                                    {registration.programme.time ? ` at ${registration.programme.time}` : ""}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                        <div className="flex flex-col">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</p>
                            <Badge variant={isPaid ? 'default' : 'destructive'} className={isPaid ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}>
                                {registration.status}
                            </Badge>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Security Key</p>
                            <p className="font-mono font-bold text-gray-900">{registration.securityHash}</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
                    <p className="text-[10px] text-gray-400 font-medium">
                        Verified via TMC Official Portal • {new Date().toLocaleString()}
                    </p>
                </div>
            </div>

            <div className="mt-8">
                <Image src="/images/logo.png" alt="TMC Logo" width={48} height={48} className="opacity-20 grayscale" />
            </div>
        </div>
    )
}
