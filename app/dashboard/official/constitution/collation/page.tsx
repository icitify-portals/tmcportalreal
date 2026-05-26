import { getConstitutionDrafts, getAggregatedFeedback } from "@/lib/actions/constitution"
import { getServerSession } from "@/lib/session"
import { db } from "@/lib/db"
import { officials, organizations } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CollationForm } from "./collation-form"

export default async function OfficialCollationPage() {
    const session = await getServerSession()
    if (!session?.user) return <div>Unauthorized</div>

    // Find official's highest active role
    const activeOfficials = await db.select().from(officials)
        .where(and(eq(officials.userId, session.user.id), eq(officials.isActive, true)))
    
    if (activeOfficials.length === 0) return <div>No official roles found.</div>
    
    // Sort roles by level. Assuming NATIONAL > STATE > LOCAL_GOVERNMENT > BRANCH
    // For collation, we only care about LGA, STATE, and NATIONAL
    let myLevel = "BRANCH"
    if (activeOfficials.some(o => o.positionLevel === "NATIONAL")) myLevel = "NATIONAL"
    else if (activeOfficials.some(o => o.positionLevel === "STATE")) myLevel = "STATE"
    else if (activeOfficials.some(o => o.positionLevel === "LOCAL_GOVERNMENT")) myLevel = "LOCAL_GOVERNMENT"

    if (myLevel === "BRANCH") {
        return <div className="p-6"><Card><CardContent className="py-10 text-center">Branch officials do not have a collation dashboard. Branch members should use the Member Review page.</CardContent></Card></div>
    }

    const drafts = await getConstitutionDrafts()
    const activeDraft = drafts.find((d: any) => d.status.includes("REVIEW") || d.status.includes("WORKSHOP")) || drafts[0]

    if (!activeDraft) {
        return <div className="p-6"><Card><CardContent className="py-10 text-center">No active constitution review drafts available.</CardContent></Card></div>
    }

    let allFeedback = await getAggregatedFeedback(activeDraft.id)

    // Filter feedback based on official's level
    // If LGA official, show MEMBER feedback under their LGA
    // If STATE official, show LGA_COLLATION feedback under their State
    // If NATIONAL official, show STATE_COLLATION feedback
    let displayFeedback: any[] = []
    let targetSubmissionLevel: "LGA_COLLATION" | "STATE_COLLATION" | "NATIONAL_COLLATION" = "LGA_COLLATION"

    if (myLevel === "LOCAL_GOVERNMENT") {
        displayFeedback = allFeedback.filter(f => f.level === "MEMBER")
        targetSubmissionLevel = "LGA_COLLATION"
    } else if (myLevel === "STATE") {
        displayFeedback = allFeedback.filter(f => f.level === "LGA_COLLATION")
        targetSubmissionLevel = "STATE_COLLATION"
    } else if (myLevel === "NATIONAL") {
        displayFeedback = allFeedback.filter(f => f.level === "STATE_COLLATION")
        targetSubmissionLevel = "NATIONAL_COLLATION"
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{myLevel.replace("_", " ")} Collation Dashboard</h1>
                <p className="text-gray-500 mt-1">Review feedback from the level below and submit your harmonized collation.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Submit {myLevel.replace("_", " ")} Collation</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CollationForm draftId={activeDraft.id} submissionLevel={targetSubmissionLevel} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Received Feedback ({displayFeedback.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="max-h-[600px] overflow-y-auto">
                        <div className="space-y-4">
                            {displayFeedback.length === 0 ? (
                                <p className="text-gray-500 text-sm">No feedback received from the subordinate levels yet.</p>
                            ) : (
                                displayFeedback.map(fb => (
                                    <div key={fb.id} className="p-4 border rounded-lg bg-gray-50">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <span className="font-bold text-gray-900">{fb.userName}</span>
                                                {fb.memberId && <Badge variant="outline" className="ml-2">{fb.memberId}</Badge>}
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
        </div>
    )
}
