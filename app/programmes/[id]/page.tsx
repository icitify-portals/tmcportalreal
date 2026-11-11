import { redirect } from "next/navigation"

export default async function ProgrammeDetailPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    redirect(`/programmes/${id}/register`)
}
