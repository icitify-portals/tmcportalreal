import { getBulkGroupForManager } from "@/lib/actions/programme-bulk";
import { PublicNav } from "@/components/layout/public-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, ExternalLink } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Manage Bulk Group | TMC Portal",
    description: "View your bulk registration group with your paymaster email.",
};

export default async function BulkManagePage({
    searchParams,
}: {
    searchParams: Promise<{ group?: string; email?: string }>;
}) {
    const sp = await searchParams;
    const groupId = (sp?.group || "").trim();
    const email = (sp?.email || "").trim();
    const data = groupId && email ? await getBulkGroupForManager(groupId, email) : null;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "";

    return (
        <div className="min-h-screen bg-gray-50">
            <PublicNav />
            <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight">Manage bulk group</h1>
                    <p className="text-sm text-muted-foreground">
                        Enter the paymaster email used at creation to view payment status and attendee claim links. No account needed.
                    </p>
                </div>

                <form action="/programmes/bulk/manage" method="GET" className="flex flex-col sm:flex-row gap-2">
                    <Input name="group" defaultValue={groupId} placeholder="Group ID" className="font-mono" required />
                    <Input name="email" type="email" defaultValue={email} placeholder="Paymaster email" required />
                    <Button type="submit" variant="outline">View</Button>
                </form>

                {data && !data.success && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                        {data.error}
                    </div>
                )}

                {data && data.success && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center justify-between gap-2">
                                <span>{data.programme?.title}</span>
                                <Badge variant={data.group.status === "PAID" ? "default" : "secondary"}>{data.group.status}</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <p>
                                {data.group.attendeeCount} attendees · ₦{Number(data.group.totalAmount || 0).toLocaleString()} total
                            </p>
                            {data.group.status !== "PAID" && (
                                <p className="text-amber-800">Payment is still pending for this group. Complete payment to activate the seats.</p>
                            )}
                            <div className="space-y-1">
                                <p className="font-bold flex items-center gap-1"><Users className="h-4 w-4 text-emerald-700" />Attendee claim links</p>
                                {(data.attendees as any[]).map((a: any) => {
                                    const link = `${baseUrl}/programmes/bulk/claim?token=${a.bulkClaimToken}`;
                                    return (
                                        <div key={a.id} className="flex items-center gap-2 text-xs p-2 border rounded bg-gray-50">
                                            <span className="flex-1 truncate">{a.name} · {a.email}</span>
                                            {a.bulkClaimedAt && <Badge variant="outline" className="bg-emerald-50">claimed</Badge>}
                                            <a href={link} target="_blank" rel="noreferrer" className="text-emerald-700" title="Open claim link">
                                                <ExternalLink className="h-3 w-3" />
                                            </a>
                                        </div>
                                    );
                                })}
                            </div>
                            <Link href="/programmes/pay-for-others" className="text-emerald-700 underline text-xs">← Back to Pay for others</Link>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
