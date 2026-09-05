export const dynamic = "force-dynamic";
import { getServerSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { programmes, bulkRegistrationGroups } from "@/lib/db/schema";
import { eq, and, ne, or } from "drizzle-orm";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BulkRegistrationForm } from "@/components/programmes/bulk/bulk-form";
import { BulkGroupCard } from "@/components/programmes/bulk/bulk-group-card";
import { Users, Plus } from "lucide-react";

export default async function BulkRegistrationLanding() {
    const session = await getServerSession();
    if (!session?.user?.id) redirect("/auth/signin");

    const myGroups = await db.select().from(bulkRegistrationGroups).where(eq(bulkRegistrationGroups.paymasterUserId, session.user.id)).orderBy(bulkRegistrationGroups.createdAt as any);

    return (
        <DashboardLayout>
            <div className="p-4 md:p-8 space-y-6 max-w-4xl">
                <div>
                    <h2 className="text-2xl font-extrabold tracking-tight">Bulk Programme Registration</h2>
                    <p className="text-sm text-muted-foreground">Pay for multiple attendees at once. Each gets a unique link to complete their profile.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-emerald-700" />Create a new bulk registration</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <BulkRegistrationForm />
                    </CardContent>
                </Card>

                <div className="space-y-3">
                    <h3 className="font-bold text-lg flex items-center gap-2"><Users className="h-5 w-5 text-emerald-700" />Your bulk groups</h3>
                    {myGroups.length === 0 ? (
                        <p className="text-sm text-muted-foreground border-2 border-dashed rounded-xl p-6 text-center">No bulk groups yet.</p>
                    ) : (
                        myGroups.map((g: any) => <BulkGroupCard key={g.id} group={g} />)
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
