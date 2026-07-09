import { getConstitutionDrafts } from "@/lib/actions/constitution"
import { getServerSession } from "@/lib/session"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ConstitutionContent } from "@/components/constitution/constitution-content"
import { MemberReviewPanel } from "./member-review-panel"

export const dynamic = "force-dynamic"

export default async function MemberConstitutionReviewPage() {
    const session = await getServerSession()
    if (!session?.user) return <div>Unauthorized</div>

    const drafts = await getConstitutionDrafts()
    
    // Find the draft currently in BRANCH_REVIEW
    const activeDraft = drafts.find((d: any) => d.status === "REVIEW_BRANCH")

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Constitution Review</h1>
                <p className="text-gray-500 mt-1">Review the ongoing constitution draft and submit your observations.</p>
            </div>

            {!activeDraft ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <h2 className="text-xl font-bold text-gray-700">No Active Review</h2>
                        <p className="text-gray-500 mt-2">There is currently no constitution draft open for member review. Member review is only available during the Branch Review phase.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <Card className="h-full">
                            <CardHeader className="border-b bg-gray-50/50">
                                <CardTitle>{activeDraft.title}</CardTitle>
                                <CardDescription>Draft content for review</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                                {activeDraft.content ? (
                                    <div className="prose max-w-none prose-sm">
                                        <p className="whitespace-pre-wrap">{activeDraft.content}</p>
                                    </div>
                                ) : (
                                    <ConstitutionContent initialApproved={null} />
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-1">
                        <Card className="sticky top-6">
                            <CardHeader className="bg-green-50/50 border-b border-green-100">
                                <CardTitle className="text-green-800">Submit Observation</CardTitle>
                                <CardDescription className="text-green-600">Your comments will be sent to the LGA collation team.</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <MemberReviewPanel draftId={activeDraft.id} user={session.user} />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    )
}
