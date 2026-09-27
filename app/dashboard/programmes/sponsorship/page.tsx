export const dynamic = "force-dynamic";
import { getServerSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SponsorshipForm } from "@/components/programmes/sponsorship/sponsor-form";
import { SponsorPoolCard } from "@/components/programmes/sponsorship/sponsor-pool-card";
import { getProgrammes } from "@/lib/actions/programmes";
import { listMySponsorshipPools } from "@/lib/actions/programme-sponsorship";
import { HeartHandshake, Ticket } from "lucide-react";
import Link from "next/link";

export default async function SponsorshipLanding() {
    const session = await getServerSession();
    if (!session?.user?.id) redirect("/auth/signin");

    const programmes = await getProgrammes({ status: "APPROVED" });
    const myPools = await listMySponsorshipPools();

    return (
        <DashboardLayout>
            <div className="p-4 md:p-8 space-y-6 max-w-4xl">
                <div>
                    <h2 className="text-2xl font-extrabold tracking-tight">Sponsor Programme Seats</h2>
                    <p className="text-sm text-muted-foreground">
                        Pay for seats upfront without naming beneficiaries. Members claim seats with your sponsor code — first come, first served.
                        {" "}Have a code? <Link href="/programmes/sponsored/claim" className="text-emerald-700 underline">Claim a sponsored seat →</Link>
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><HeartHandshake className="h-5 w-5 text-emerald-700" />New sponsorship</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <SponsorshipForm programmes={programmes as any} />
                    </CardContent>
                </Card>

                <div className="space-y-3">
                    <h3 className="font-bold text-lg flex items-center gap-2"><Ticket className="h-5 w-5 text-emerald-700" />Your sponsorships</h3>
                    {myPools.length === 0 ? (
                        <p className="text-sm text-muted-foreground border-2 border-dashed rounded-xl p-6 text-center">No sponsorships yet.</p>
                    ) : (
                        myPools.map((row: any) => (
                            <SponsorPoolCard key={row.pool.id} pool={row.pool} programmeTitle={row.programme?.title} />
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
