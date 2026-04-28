import { verifyProgrammeRegistrationPayment } from "@/lib/actions/programmes"
import { redirect } from "next/navigation"
import { Loader2 } from "lucide-react"

export default async function VerifyRegistrationPage({
    params,
    searchParams
}: {
    params: Promise<{ id: string }>,
    searchParams: Promise<{ reference?: string, trxref?: string }>
}) {
    const { id } = await params
    const { reference, trxref } = await searchParams
    
    const paymentRef = reference || trxref

    if (!paymentRef) {
        redirect(`/programmes/registrations/${id}/slip`)
    }

    // Verify and Update
    const result = await verifyProgrammeRegistrationPayment(id, paymentRef)
    
    // Redirect to slip regardless of success (slip will show pending if failed)
    redirect(`/programmes/registrations/${id}/slip`)
}
