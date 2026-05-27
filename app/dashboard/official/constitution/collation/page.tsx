import { getConstitutionDrafts, getAggregatedFeedback } from "@/lib/actions/constitution"
import { getServerSession } from "@/lib/session"
import { db } from "@/lib/db"
import { officials, organizations } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CollationForm } from "./collation-form"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

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
    let officialOrgId = ""
    if (activeOfficials.some(o => o.positionLevel === "NATIONAL")) {
        myLevel = "NATIONAL"
        officialOrgId = activeOfficials.find(o => o.positionLevel === "NATIONAL")!.organizationId
    } else if (activeOfficials.some(o => o.positionLevel === "STATE")) {
        myLevel = "STATE"
        officialOrgId = activeOfficials.find(o => o.positionLevel === "STATE")!.organizationId
    } else if (activeOfficials.some(o => o.positionLevel === "LOCAL_GOVERNMENT")) {
        myLevel = "LOCAL_GOVERNMENT"
        officialOrgId = activeOfficials.find(o => o.positionLevel === "LOCAL_GOVERNMENT")!.organizationId
    }

    if (myLevel === "BRANCH") {
        return <div className="p-6"><Card><CardContent className="py-10 text-center">Branch officials do not have a collation dashboard. Branch members should use the Member Review page.</CardContent></Card></div>
    }

    const drafts = await getConstitutionDrafts()
    const activeDraft = drafts.find((d: any) => d.status.includes("REVIEW") || d.status.includes("WORKSHOP")) || drafts[0]

    if (!activeDraft) {
        return <div className="p-6"><Card><CardContent className="py-10 text-center">No active constitution review drafts available.</CardContent></Card></div>
    }

    let allFeedback = await getAggregatedFeedback(activeDraft.id)

    // Filter feedback based on official's level AND jurisdiction
    let filteredFeedback: any[] = []
    let targetSubmissionLevel: "LGA_COLLATION" | "STATE_COLLATION" | "NATIONAL_COLLATION" = "LGA_COLLATION"
    let groupByField: "jurisdictionBranchId" | "jurisdictionLgaId" | "jurisdictionStateId" = "jurisdictionBranchId"

    if (myLevel === "LOCAL_GOVERNMENT") {
        filteredFeedback = allFeedback.filter(f => f.level === "MEMBER" && f.jurisdictionLgaId === officialOrgId)
        targetSubmissionLevel = "LGA_COLLATION"
        groupByField = "jurisdictionBranchId"
    } else if (myLevel === "STATE") {
        filteredFeedback = allFeedback.filter(f => f.level === "LGA_COLLATION" && f.jurisdictionStateId === officialOrgId)
        targetSubmissionLevel = "STATE_COLLATION"
        groupByField = "jurisdictionLgaId"
    } else if (myLevel === "NATIONAL") {
        filteredFeedback = allFeedback.filter(f => f.level === "STATE_COLLATION")
        targetSubmissionLevel = "NATIONAL_COLLATION"
        groupByField = "jurisdictionStateId"
    }

    // Fetch organizations to map IDs to names
    const orgs = await db.select({ id: organizations.id, name: organizations.name }).from(organizations)
    const orgMap: Record<string, string> = {}
    orgs.forEach(o => { orgMap[o.id] = o.name })

    // Group the feedback
    const groupedFeedback: Record<string, any[]> = {}
    filteredFeedback.forEach(f => {
        const keyId = f[groupByField]
        const groupName = keyId && orgMap[keyId] ? orgMap[keyId] : "Unknown Jurisdiction"
        if (!groupedFeedback[groupName]) {
            groupedFeedback[groupName] = []
        }
        groupedFeedback[groupName].push(f)
    })

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
                        <CardTitle>Received Feedback ({filteredFeedback.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="max-h-[600px] overflow-y-auto">
                        <div className="space-y-4">
                            {Object.keys(groupedFeedback).length === 0 ? (
                                <p className="text-gray-500 text-sm">No feedback received from the subordinate levels yet.</p>
                            ) : (
                                <Accordion type="multiple" className="w-full">
                                    {Object.entries(groupedFeedback).map(([groupName, groupFeedbacks]) => (
                                        <AccordionItem value={groupName} key={groupName}>
                                            <AccordionTrigger className="font-semibold text-lg hover:no-underline hover:text-green-700">
                                                <div className="flex items-center gap-2">
                                                    {groupName} <Badge variant="secondary">{groupFeedbacks.length} comments</Badge>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <div className="space-y-3 pt-2">
                                                    {groupFeedbacks.map(fb => (
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
                                                    ))}
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
