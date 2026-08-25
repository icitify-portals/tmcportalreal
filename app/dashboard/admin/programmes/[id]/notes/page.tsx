export const dynamic = "force-dynamic";
import { getServerSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { programmes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { NotesWorkspace } from "@/components/meeting-notes/notes-workspace";
import { getMeetingNotes } from "@/lib/actions/meeting-notes";

export default async function ProgrammeNotesPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session?.user?.id) redirect("/auth/signin");
  const { id } = await params;
  const [programme] = await db.select().from(programmes).where(eq(programmes.id, id)).limit(1);
  if (!programme) redirect("/dashboard/admin/programmes");
  const notes = await getMeetingNotes({ programmeId: id });
  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Event Notes — {programme.title}</h2>
          <p className="text-sm text-muted-foreground">Take notes at events like OneNote. Sections: Agenda, Minutes, Decisions, Actions.</p>
        </div>
        <NotesWorkspace initialNotes={notes as any} programmeId={id} meetingTitle={programme.title} />
      </div>
    </DashboardLayout>
  );
}
