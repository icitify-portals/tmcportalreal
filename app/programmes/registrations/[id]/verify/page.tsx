import { verifyProgrammeRegistrationPayment } from "@/lib/actions/programmes"
import { redirect } from "next/navigation"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function VerifyPaymentPage({
    params,
    searchParams
}: {
    params: Promise<{ id: string }>,
    searchParams: Promise<{ reference?: string }>
}) {
    const { id } = await params
    const { reference } = await searchParams

    if (!reference) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
                <XCircle className="h-16 w-16 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold mb-2">Invalid Request</h1>
                <p className="text-muted-foreground mb-6">No payment reference found.</p>
                <Button asChild>
                    <Link href="/programmes">Back to Programmes</Link>
                </Button>
            </div>
        )
    }

    const result = await verifyProgrammeRegistrationPayment(id, reference)

    if (result.success) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
                <CheckCircle2 className="h-16 w-16 text-green-500 mb-4 animate-bounce" />
                <h1 className="text-2xl font-bold mb-2 text-green-700">Payment Successful!</h1>
                <p className="text-muted-foreground mb-6">
                    Your registration for the programme is now confirmed.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <Button asChild className="bg-green-700 hover:bg-green-800">
                        <Link href={`/programmes/registrations/${id}/slip`}>
                            Print Access Slip
                        </Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/dashboard/member/programmes">
                            My Programmes
                        </Link>
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
            <XCircle className="h-16 w-16 text-red-500 mb-4" />
            <h1 className="text-2xl font-bold mb-2 text-red-700">Payment Verification Failed</h1>
            <p className="text-muted-foreground mb-6">
                {result.error || "We could not verify your payment. Please contact support."}
            </p>
            <Button asChild variant="outline">
                <Link href={`/programmes`}>Return to Programmes</Link>
            </Button>
        </div>
    )
}
