"use client";

import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, MapPin, Video, Search, X } from "lucide-react";
import Link from "next/link";
import { ClientDate } from "@/components/ui/client-date";
import { DeleteMeetingButton } from "@/components/meetings/delete-meeting-button";

export interface MeetingItem {
  id: string;
  title: string;
  scheduledAt: string | Date;
  venue?: string | null;
  isOnline?: boolean | null;
  status: string;
}

export function MeetingsClientTable({ meetings }: { meetings: MeetingItem[] }) {
  const [query, setQuery] = useState("");

  const filteredMeetings = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return meetings;
    return meetings.filter((m) => {
      const matchTitle = m.title?.toLowerCase().includes(q);
      const matchVenue = (m.venue || "").toLowerCase().includes(q);
      const matchStatus = (m.status || "").toLowerCase().includes(q);
      return matchTitle || matchVenue || matchStatus;
    });
  }, [meetings, query]);

  return (
    <div className="space-y-3">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Filter meetings (min. 2-3 characters)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 pr-8 h-9 text-sm"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="overflow-x-auto border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Venue</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMeetings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  {query ? `No meetings matching "${query}".` : "No meetings scheduled."}
                </TableCell>
              </TableRow>
            ) : (
              filteredMeetings.map((meeting) => (
                <TableRow key={meeting.id}>
                  <TableCell suppressHydrationWarning>
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      <ClientDate date={meeting.scheduledAt} formatString="PPP p" />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{meeting.title}</TableCell>
                  <TableCell>
                    {meeting.isOnline ? (
                      <div className="flex items-center">
                        <Video className="mr-2 h-4 w-4" /> Online
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <MapPin className="mr-2 h-4 w-4" /> {meeting.venue || "Physical"}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        meeting.status === "SCHEDULED"
                          ? "outline"
                          : meeting.status === "ONGOING"
                          ? "default"
                          : meeting.status === "ENDED"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {meeting.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/admin/meetings/${meeting.id}`}>Manage</Link>
                      </Button>
                      <DeleteMeetingButton meetingId={meeting.id} meetingTitle={meeting.title} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {query && query.length >= 2 && (
        <div className="text-xs text-muted-foreground">
          Showing {filteredMeetings.length} of {meetings.length} meetings matching &ldquo;{query}&rdquo;
        </div>
      )}
    </div>
  );
}
