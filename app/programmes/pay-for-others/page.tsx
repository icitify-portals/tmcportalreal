export const dynamic = "force-dynamic";
import { PublicNav } from "@/components/layout/public-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BulkRegistrationForm } from "@/components/programmes/bulk/bulk-form";
import { SponsorshipForm } from "@/components/programmes/sponsorship/sponsor-form";
import { getProgrammes } from "@/lib/actions/programmes";
import { Users, HeartHandshake, TicketCheck, ClipboardList } from "lucide-react";
import Link from "next/link";

export const metadata = {
    title: "Pay for Others | TMC Portal",
    description: "Register multiple people or sponsor seats for a programme — no account needed.",
};

export default async function PayForOthersPage() {
    const programmes = await getProgrammes({ status: "APPROVED" });

    return (
        <div className="min-h-screen bg-gray-50">
            <PublicNav />
            <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight">Pay for others</h1>
                    <p className="text-sm text-muted-foreground">
                        Members and non-members alike can pay for multiple participants — with or without an account.
                        Already have a bulk group or sponsor code?{" "}
                        <Link href="/programmes/bulk/manage" className="text-emerald-700 underline">Manage a bulk group →</Link>
                        {" "}·{" "}
                        <Link href="/programmes/sponsored/claim" className="text-emerald-700 underline">Claim a sponsored seat →</Link>
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-emerald-700" />Option 1 — Named bulk registration</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground mb-4 flex items-start gap-1">
                            <ClipboardList className="h-3.5 w-3.5 mt-0.5" />
                            List each person by name + email (e.g. a secretary registering 20 LG members). Each gets a claim link. You pay once for all.
                        </p>
                        <BulkRegistrationForm programmes={programmes as any} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><HeartHandshake className="h-5 w-5 text-emerald-700" />Option 2 — Blind sponsorship</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground mb-4 flex items-start gap-1">
                            <TicketCheck className="h-3.5 w-3.5 mt-0.5" />
                            Pay for N seats without naming anyone (e.g. a philanthropist sponsoring 12 members). Share your sponsor code; members claim first-come.
                        </p>
                        <SponsorshipForm programmes={programmes as any} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
