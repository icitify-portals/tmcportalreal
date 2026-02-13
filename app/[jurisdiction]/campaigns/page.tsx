
import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { organizations, fundraisingCampaigns } from "@/lib/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, User } from "lucide-react"
import { format } from "date-fns"

export const dynamic = "force-dynamic"

interface PageProps {
    params: Promise<{ jurisdiction: string }>
}

export default async function CampaignsIndexPage(props: PageProps) {
    const params = await props.params;
    const orgCode = params.jurisdiction.toUpperCase()

    const org = await db.query.organizations.findFirst({
        where: eq(organizations.code, orgCode),
    })

    if (!org) return notFound()

    const campaigns = await db.query.fundraisingCampaigns.findMany({
        where: and(
            eq(fundraisingCampaigns.organizationId, org.id),
            eq(fundraisingCampaigns.status, 'ACTIVE')
        ),
        orderBy: [desc(fundraisingCampaigns.createdAt)]
    })

    return (
        <div className="min-h-screen bg-muted/10">
            <div className="bg-background border-b py-4">
                <div className="container px-4 md:px-6">
                    <Link href={`/${params.jurisdiction}`} className="flex items-center text-sm text-muted-foreground hover:text-primary">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to {org.name}
                    </Link>
                </div>
            </div>

            <div className="container px-4 md:px-6 py-10 space-y-10">
                <div className="text-center space-y-4">
                    <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Start Changing Lives</h1>
                    <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                        Support causes that matter to our community. Every donation makes a difference.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {campaigns.map((campaign) => {
                        const target = parseFloat(campaign.targetAmount || "0");
                        const raised = parseFloat(campaign.raisedAmount || "0");
                        const percentage = target > 0 ? Math.min((raised / target) * 100, 100) : 0;

                        return (
                            <Link key={campaign.id} href={`/${params.jurisdiction}/campaigns/${campaign.slug}`}>
                                <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden flex flex-col">
                                    {campaign.coverImage && (
                                        <div className="aspect-video w-full overflow-hidden">
                                            <img
                                                src={campaign.coverImage}
                                                alt={campaign.title}
                                                className="h-full w-full object-cover transition-transform hover:scale-105"
                                            />
                                        </div>
                                    )}
                                    <CardHeader>
                                        <CardTitle className="line-clamp-1">{campaign.title}</CardTitle>
                                        <CardDescription className="line-clamp-2">{campaign.description?.replace(/<[^>]*>?/gm, "")}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="mt-auto space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-semibold text-primary">₦{raised.toLocaleString()}</span>
                                                <span className="text-muted-foreground">of ₦{target.toLocaleString()} goal</span>
                                            </div>
                                            <Progress value={percentage} className="h-2" />
                                        </div>
                                        <Button className="w-full">Donate Now</Button>
                                    </CardContent>
                                </Card>
                            </Link>
                        )
                    })}

                    {campaigns.length === 0 && (
                        <div className="col-span-full py-12 text-center">
                            <h3 className="text-lg font-medium">No active campaigns at the moment.</h3>
                            <p className="text-muted-foreground">Please check back later.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
