import { getConstitutionDrafts, getAggregatedFeedback } from "@/lib/actions/constitution"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function ConstitutionAnalyticsPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
    const params = await searchParams;
    const drafts = await getConstitutionDrafts()
    const activeDraft = drafts.find((d: any) => d.id === params.id) || drafts[0]

    let allFeedback: any[] = []
    if (activeDraft) {
        allFeedback = await getAggregatedFeedback(activeDraft.id)
    }

    const branchComments = allFeedback.filter(f => f.level === "MEMBER")
    const lgaComments = allFeedback.filter(f => f.level === "LGA_COLLATION")
    const stateComments = allFeedback.filter(f => f.level === "STATE_COLLATION")

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Constitution Collation Analytics</h1>
                <p className="text-gray-500 mt-1">Aggregated insights on comments from all levels.</p>
            </div>

            {activeDraft && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Total Comments</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold">{allFeedback.length}</p></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Member (Branch) Level</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold text-blue-600">{branchComments.length}</p></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">LGA Collation Submissions</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold text-orange-600">{lgaComments.length}</p></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">State Collation Submissions</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold text-purple-600">{stateComments.length}</p></CardContent>
                    </Card>
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Detailed Feedback Log</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {allFeedback.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">No feedback has been submitted yet.</p>
                        ) : (
                            allFeedback.map(fb => (
                                <div key={fb.id} className="p-4 border rounded-lg bg-gray-50">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className="font-bold text-gray-900">{fb.userName}</span>
                                            {fb.memberId && <Badge variant="outline" className="ml-2">{fb.memberId}</Badge>}
                                            {fb.level !== "MEMBER" && <Badge className="ml-2 bg-indigo-600">{fb.level.replace("_COLLATION", "")} OFFICIAL</Badge>}
                                        </div>
                                        <span className="text-xs text-gray-500">{new Date(fb.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    {fb.section && <Badge variant="secondary" className="mb-2">Section: {fb.section}</Badge>}
                                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{fb.comment}</p>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
