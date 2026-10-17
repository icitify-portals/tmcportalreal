import { getServerSession } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getSponsorshipPoolById } from "@/lib/actions/programme-sponsorship";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HeartHandshake, Users, TicketCheck, ExternalLink } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SponsorshipPoolDetailPage({ params }: { params: Promise<{ poolId: string }> }) {
    const { poolId } = await params;
    const session = await getServerSession();
    if (!session?.user?.id) redirect("/auth/signin");

    const data = await getSponsorshipPoolById(poolId);
    if (!data) return notFound();

    const { pool, programme, attendees, seatsLeft } = data;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://tmcng.net";
    const claimUrl = `${baseUrl}/programmes/sponsored/claim?code=${encodeURIComponent(pool.sponsorCode)}`;

    return (
        <DashboardLayout>
            <div className="p-4 md:p-8 space-y-6 max-w-4xl">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <Link href="/dashboard/programmes/sponsorship" className="text-sm text-emerald-700 hover:underline mb-2 inline-block">
                            ← Back to Sponsorships
                        </Link>
                        <h2 className="text-2xl font-extrabold tracking-tight">Sponsorship Pool Details</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant={pool.status === "PAID" ? "default" : "secondary"}>{pool.status}</Badge>
                        {pool.sponsorCode && (
                            <span className="font-mono font-bold tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded border border-emerald-200">
                                {pool.sponsorCode}
                            </span>
                        )}
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="flex items-center gap-2">
                                <HeartHandshake className="h-5 w-5 text-emerald-700" />
                                {programme?.title || "Programme"}
                            </span>
                            {pool.status === "PAID" && seatsLeft > 0 && (
                                <Button asChild size="sm" className="bg-emerald-700 hover:bg-emerald-800">
                                    <Link href={`/programmes/sponsored/claim?code=${encodeURIComponent(pool.sponsorCode)}`}>
                                        <TicketCheck className="h-4 w-4 mr-1.5" />
                                        Claim / Assign a Seat ({seatsLeft} left)
                                    </Link>
                                </Button>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                                <p className="text-xs text-emerald-700 font-bold uppercase">Sponsor</p>
                                <p className="font-medium">{pool.sponsorName}</p>
                            </div>
                            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                                <p className="text-xs text-emerald-700 font-bold uppercase">Seats</p>
                                <p className="font-medium">{pool.seatCount} total &bull; {pool.seatsClaimed || 0} claimed &bull; {seatsLeft} left</p>
                            </div>
                            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                                <p className="text-xs text-emerald-700 font-bold uppercase">Total Paid</p>
                                <p className="font-medium">₦{Number(pool.totalAmount || 0).toLocaleString()}</p>
                            </div>
                        </div>

                        {pool.status === "PAID" && (
                            <div className="p-3 bg-gray-50 rounded-lg border text-xs space-y-1">
                                <p className="font-semibold text-gray-700">Shareable Beneficiary Claim Link:</p>
                                <p className="font-mono text-emerald-800 break-all select-all">{claimUrl}</p>
                            </div>
                        )}

                        {pool.sponsorEmail && (
                            <p className="text-sm text-muted-foreground">
                                Contact: {pool.sponsorEmail} {pool.sponsorPhone && `• ${pool.sponsorPhone}`}
                            </p>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <Users className="h-5 w-5 text-emerald-700" />
                                Beneficiaries ({attendees.length})
                            </h3>
                        </div>

                        {attendees.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl space-y-3">
                                <p>No seats claimed yet. Share the sponsor code <b>{pool.sponsorCode}</b> with beneficiaries or assign seats directly.</p>
                                {pool.status === "PAID" && (
                                    <Button asChild size="sm" variant="outline">
                                        <Link href={`/programmes/sponsored/claim?code=${encodeURIComponent(pool.sponsorCode)}`}>
                                            Open Claim Form for {pool.sponsorCode} →
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-muted-foreground">
                                            <th className="pb-2">Name</th>
                                            <th className="pb-2">Email</th>
                                            <th className="pb-2">State</th>
                                            <th className="pb-2">LGA</th>
                                            <th className="pb-2">Branch</th>
                                            <th className="pb-2">Phone</th>
                                            <th className="pb-2">Claimed At</th>
                                            <th className="pb-2">Status</th>
                                            <th className="pb-2">Slip</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {attendees.map((a: any) => (
                                            <tr key={a.id} className="border-b">
                                                <td className="py-2 font-medium">{a.name}</td>
                                                <td className="py-2">{a.email}</td>
                                                <td className="py-2">{a.state || "-"}</td>
                                                <td className="py-2">{a.lga || "-"}</td>
                                                <td className="py-2">{a.branch || "-"}</td>
                                                <td className="py-2">{a.phone || "-"}</td>
                                                <td className="py-2 text-muted-foreground">{a.registeredAt ? new Date(a.registeredAt).toLocaleString() : "-"}</td>
                                                <td className="py-2">
                                                    <Badge variant={a.status === "PAID" ? "default" : "secondary"}>{a.status}</Badge>
                                                </td>
                                                <td className="py-2">
                                                    <a href={`/programmes/registrations/${a.id}/slip`} target="_blank" className="text-emerald-700 hover:underline inline-flex items-center gap-1 text-xs font-medium">
                                                        Slip <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}