import { ConstitutionContent } from "@/components/constitution/constitution-content"
import { getApprovedConstitution } from "@/lib/actions/constitution"

export default async function ConstitutionPage() {
    const approvedDoc = await getApprovedConstitution()
    return <ConstitutionContent initialApproved={approvedDoc} />
}

