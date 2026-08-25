export const dynamic = "force-dynamic";
import { getServerSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { NotesWorkspace } from "@/components/meeting-notes/notes-workspace";
import { getMeetingNotes } from "@/lib/actions/meeting-notes";

export default async function GeneralNotesPage() {
  const session = await getServerSession();
  if (!session?.user?.id) redirect("/auth/signin");
  const notes = await getMeetingNotes({});
  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Notes — OneNote</h2>
          <p className="text-sm text-muted-foreground">Personal notebook. Organize by General/Agenda/Minutes. Works for any meeting or event.</p>
        </div>
        <NotesWorkspace initialNotes={notes as any} meetingTitle="My Notebook" />
      </div>
    </DashboardLayout>
  );
}
