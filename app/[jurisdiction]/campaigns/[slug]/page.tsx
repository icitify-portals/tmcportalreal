
import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { organizations, fundraisingCampaigns, payments } from "@/lib/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Share2, Calendar, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { DonationWidget } from "@/components/campaigns/donation-widget"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export const dynamic = "force-dynamic"

interface PageProps {
    params: Promise<{ jurisdiction: string, slug: string }>
}

export default async function CampaignDetailPage(props: PageProps) {
    const params = await props.params;
    const orgCode = params.jurisdiction.toUpperCase()

    const org = await db.query.organizations.findFirst({
        where: eq(organizations.code, orgCode),
    })

    if (!org) return notFound()

    const campaign = await db.query.fundraisingCampaigns.findFirst({
        where: and(
            eq(fundraisingCampaigns.organizationId, org.id),
            eq(fundraisingCampaigns.slug, params.slug)
        ),
        with: {
            donations: {
                limit: 5,
                orderBy: [desc(payments.createdAt)],
                where: eq(payments.status, 'SUCCESS')
            }
        }
    })

    if (!campaign) return notFound()

    const target = parseFloat(campaign.targetAmount || "0");
    const raised = parseFloat(campaign.raisedAmount || "0");
    const percentage = target > 0 ? Math.min((raised / target) * 100, 100) : 0;

    // Suggested amounts parsing
    let suggestedAmounts = [1000, 5000, 10000];
    if (campaign.suggestedAmounts && Array.isArray(campaign.suggestedAmounts)) {
        suggestedAmounts = campaign.suggestedAmounts as number[];
    }

    return (
        <div className="min-h-screen bg-muted/10 pb-20">
            {/* Header */}
            <div className="bg-background border-b py-4">
                <div className="container px-4 md:px-6">
                    <Link href={`/${params.jurisdiction}/campaigns`} className="flex items-center text-sm text-muted-foreground hover:text-primary">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Campaigns
                    </Link>
                </div>
            </div>

            <div className="container px-4 md:px-6 py-8">
                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight lg:text-4xl mb-2">{campaign.title}</h1>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {format(new Date(campaign.startDate || new Date()), "MMMM d, yyyy")}
                                </span>
                                <Badge variant="secondary">{org.name}</Badge>
                            </div>
                        </div>

                        {campaign.coverImage && (
                            <div className="aspect-video w-full overflow-hidden rounded-xl border bg-muted">
                                <img
                                    src={campaign.coverImage}
                                    alt={campaign.title}
                                    className="h-full w-full object-cover"
                                />
                            </div>
                        )}

                        <div className="prose max-w-none dark:prose-invert">
                            {/* Simple text rendering for now, or HTML if stored */}
                            <p className="whitespace-pre-wrap">{campaign.description}</p>
                        </div>
                    </div>

                    {/* Sidebar / Donation Widget */}
                    <div className="space-y-6">
                        {/* Progress Card */}
                        <div className="rounded-xl border bg-card text-card-foreground shadow p-6 space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-end gap-2">
                                    <span className="text-3xl font-bold text-primary">₦{raised.toLocaleString()}</span>
                                    <span className="text-muted-foreground mb-1">raised of ₦{target.toLocaleString()}</span>
                                </div>
                                <Progress value={percentage} className="h-3" />
                            </div>

                            <DonationWidget
                                campaignId={campaign.id}
                                suggestedAmounts={suggestedAmounts}
                                allowCustomAmount={campaign.allowCustomAmount ?? true}
                            />

                            <div className="pt-4 flex justify-center">
                                <Button variant="ghost" size="sm" className="gap-2">
                                    <Share2 className="h-4 w-4" /> Share this campaign
                                </Button>
                            </div>
                        </div>

                        {/* Recent Donors */}
                        {campaign.donations && campaign.donations.length > 0 && (
                            <div className="rounded-xl border bg-card text-card-foreground shadow p-6 space-y-4">
                                <h3 className="font-semibold">Recent Donations</h3>
                                <div className="space-y-4">
                                    {campaign.donations.map((donation: any) => (
                                        <div key={donation.id} className="flex items-center gap-3 text-sm">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <div className="font-medium">
                                                    {(donation.metadata as any)?.anonymous ? "Anonymous" : (donation.metadata as any)?.donorName || "Supporter"}
                                                </div>
                                                <div className="text-muted-foreground text-xs">
                                                    {format(new Date(donation.createdAt), "MMM d")}
                                                </div>
                                            </div>
                                            <div className="font-semibold">₦{parseFloat(donation.amount).toLocaleString()}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
