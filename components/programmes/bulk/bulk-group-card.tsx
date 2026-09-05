"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, Users, CheckCircle } from "lucide-react";
import { listBulkAttendees } from "@/lib/actions/programme-bulk";
import { toast } from "sonner";

export function BulkGroupCard({ group }: { group: any }) {
    const [attendees, setAttendees] = useState<any[]>([]);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        if (expanded && attendees.length === 0) {
            listBulkAttendees(group.id).then(setAttendees);
        }
    }, [expanded]);

    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const linkFor = (token: string) => `${baseUrl}/programmes/bulk/claim?token=${token}`;
    const copied = (label: string) => toast.success(label);

    return (
        <Card>
            <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <div className="font-bold">{group.attendeeCount} attendees · ₦{Number(group.totalAmount).toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Created {new Date(group.createdAt).toLocaleString()}</div>
                    </div>
                    <Badge className={group.status === "PAID" ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"}>{group.status}</Badge>
                </div>
                {group.status === "PAID" && (
                    <div className="text-xs text-emerald-700 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Payment verified — claim links below</div>
                )}
                <Button size="sm" variant="outline" onClick={() => setExpanded(e => !e)}>
                    {expanded ? "Hide" : "Show"} attendee claim links
                </Button>
                {expanded && attendees.length > 0 && (
                    <div className="space-y-1 mt-2 max-h-72 overflow-auto">
                        {attendees.map((a) => (
                            <div key={a.id} className="flex items-center gap-2 text-xs p-2 border rounded bg-gray-50">
                                <Users className="h-3 w-3" />
                                <span className="flex-1 truncate">{a.name} · {a.email}</span>
                                <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(linkFor(a.bulkClaimToken)); copied("Claim link copied"); }}>
                                    <Copy className="h-3 w-3" />
                                </Button>
                                <a href={linkFor(a.bulkClaimToken)} target="_blank" rel="noreferrer" className="text-emerald-700"><ExternalLink className="h-3 w-3" /></a>
                                {a.bulkClaimedAt && <Badge variant="outline" className="bg-emerald-50">claimed</Badge>}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
