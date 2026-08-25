export const dynamic = "force-dynamic";
import { getServerSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { meetings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { NotesWorkspace } from "@/components/meeting-notes/notes-workspace";
import { getMeetingNotes } from "@/lib/actions/meeting-notes";

export default async function MeetingNotesPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session?.user?.id) redirect("/auth/signin");
  const { id } = await params;
  const [meeting] = await db.select().from(meetings).where(eq(meetings.id, id)).limit(1);
  if (!meeting) redirect("/dashboard/admin/meetings");
  const notes = await getMeetingNotes({ meetingId: id });
  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Meeting Notes — {meeting.title}</h2>
          <p className="text-sm text-muted-foreground">OneNote-like workspace. Take notes before/during/after meetings and events. Sections auto-save, share with attendees.</p>
        </div>
        <NotesWorkspace initialNotes={notes as any} meetingId={id} meetingTitle={meeting.title} />
      </div>
    </DashboardLayout>
  );
}
