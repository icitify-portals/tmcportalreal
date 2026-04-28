import { getRegistrationDetails } from "@/lib/actions/programmes"
import { redirect } from "next/navigation"
import Image from "next/image"
import { MapPin, Calendar, Clock, User, ShieldCheck, Mail, Phone, CreditCard } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ClientCurrency } from "@/components/ui/client-currency"
import { format } from "date-fns"

export default async function AccessSlipPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const registration = await getRegistrationDetails(id)

    if (!registration) redirect("/programmes")

    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/admin/programmes/${registration.programmeId}/verify?regId=${id}`
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verificationUrl)}`

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 print:bg-white print:py-0 print:px-0">
            <div className="max-w-3xl mx-auto bg-white border-2 border-gray-200 rounded-2xl shadow-xl overflow-hidden print:shadow-none print:border-0 print:max-w-full">
                
                {/* Header with Logo */}
                <div className="bg-green-700 text-white p-8 flex justify-between items-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-white p-1.5 rounded-lg">
                                <Image 
                                    src="/images/logo.png" 
                                    alt="TMC Logo" 
                                    width={40} 
                                    height={40} 
                                    className="object-contain"
                                />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight">THE MUSLIM CONGRESS</h1>
                                <p className="text-xs text-green-100 font-medium tracking-widest uppercase">Official Programme Access Pass</p>
                            </div>
                        </div>
                    </div>
                    <div className="text-right relative z-10">
                        <Badge variant="outline" className="bg-white/20 border-white/30 text-white text-[10px] font-bold uppercase tracking-widest">
                            {registration.status === 'PAID' ? 'CONFIRMED' : 'ACCESS GRANTED'}
                        </Badge>
                    </div>
                </div>

                <div className="p-8 grid md:grid-cols-3 gap-8">
                    
                    {/* Left Column: QR and Photo */}
                    <div className="flex flex-col items-center gap-6 border-b md:border-b-0 md:border-r border-gray-100 pb-8 md:pb-0">
                        <div className="relative group">
                            <div className="w-32 h-32 bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-200 flex items-center justify-center">
                                {registration.user?.image ? (
                                    <Image src={registration.user.image} alt="User" width={128} height={128} className="object-cover" />
                                ) : (
                                    <User className="w-16 h-16 text-gray-300" />
                                )}
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-green-600 text-white p-1.5 rounded-lg shadow-lg">
                                <ShieldCheck className="w-4 h-4" />
                            </div>
                        </div>

                        <div className="text-center">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Scan to Verify</p>
                            <div className="p-2 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                                <Image src={qrCodeUrl} alt="Verification QR Code" width={120} height={120} />
                            </div>
                        </div>

                        <div className="mt-auto pt-4 text-center">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Security Key</p>
                            <code className="text-lg font-mono font-bold text-green-700 tracking-tighter">
                                {registration.securityHash}
                            </code>
                        </div>
                    </div>

                    {/* Right Column: Details */}
                    <div className="md:col-span-2 space-y-8">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 mb-6 leading-tight">
                                {registration.programme.title}
                            </h2>
                            
                            <div className="grid grid-cols-2 gap-y-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Attendee Name</p>
                                    <p className="font-bold text-gray-800">{registration.name}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Membership ID</p>
                                    <p className="font-bold text-gray-800">{registration.member?.membershipId || "Guest Attendee"}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Address</p>
                                    <p className="font-medium text-gray-600 text-sm">{registration.email}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone Number</p>
                                    <p className="font-medium text-gray-600 text-sm">{registration.phone || "N/A"}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100">
                                    <MapPin className="w-5 h-5 text-green-700" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Venue</p>
                                    <p className="font-semibold text-gray-800">{registration.programme.venue}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100">
                                        <Calendar className="w-5 h-5 text-green-700" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</p>
                                        <p className="font-semibold text-gray-800">
                                            {format(new Date(registration.programme.startDate), "EEE, MMM d, yyyy")}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100">
                                        <Clock className="w-5 h-5 text-green-700" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Time</p>
                                        <p className="font-semibold text-gray-800">{registration.programme.time || "TBA"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex items-center justify-between border-t border-gray-100">
                            <div className="flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-gray-400" />
                                <span className="text-xs font-medium text-gray-500">Amount Paid:</span>
                                <ClientCurrency amount={parseFloat(registration.amountPaid || "0")} className="font-bold text-gray-900" />
                            </div>
                            <p className="text-[10px] font-mono text-gray-400">
                                REF: {registration.paymentReference || registration.id.substring(0, 8)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer Section */}
                <div className="bg-gray-50 p-6 border-t border-gray-100 flex justify-between items-center print:hidden">
                    <p className="text-xs text-gray-400 italic">Please present this slip at the venue for entry.</p>
                    <button 
                        onClick={() => window.print()}
                        className="flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-green-800 transition-colors shadow-lg shadow-green-700/20"
                    >
                        <Printer className="w-4 h-4" />
                        Print Access Slip
                    </button>
                </div>
            </div>

            {/* Print Only Notice */}
            <div className="hidden print:block mt-8 text-center text-[10px] text-gray-400 border-t pt-4 max-w-3xl mx-auto">
                This is a computer-generated document. For verification, scan the QR code or use the security key. 
                Generated via TMC Portal on {new Date().toLocaleString()}
            </div>
        </div>
    )
}
