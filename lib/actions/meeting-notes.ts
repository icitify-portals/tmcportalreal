"use server";

import { db } from "@/lib/db";
import { meetingNotes, meetingNoteVersions, meetings, meetingAttendances, officials, programmes, users } from "@/lib/db/schema";
import { eq, and, or, like, desc, sql } from "drizzle-orm";
import { getServerSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const NoteSchema = z.object({
  meetingId: z.string().optional().nullable(),
  programmeId: z.string().optional().nullable(),
  title: z.string().min(1),
  section: z.enum(["GENERAL", "AGENDA", "MINUTES", "DECISIONS", "ACTIONS", "FOLLOW_UP"]).default("GENERAL"),
  content: z.any().optional(),
  html: z.string().optional().nullable(),
  plainText: z.string().optional().nullable(),
  isShared: z.boolean().optional(),
});

export async function getMeetingAccess(meetingId: string, userId: string, isSuperAdmin = false) {
  const [meeting] = await db.select({ createdBy: meetings.createdBy })
    .from(meetings)
    .where(eq(meetings.id, meetingId))
    .limit(1);
  if (!meeting) return { allowed: false, isHost: false };

  const isHost = meeting.createdBy === userId;
  if (isHost || isSuperAdmin) return { allowed: true, isHost };

  const [official] = await db.select({ userId: officials.userId })
    .from(officials)
    .where(eq(officials.userId, userId))
    .limit(1);
  if (official) return { allowed: true, isHost: false };

  const [attendance] = await db.select({ id: meetingAttendances.id })
    .from(meetingAttendances)
    .where(and(
      eq(meetingAttendances.meetingId, meetingId),
      eq(meetingAttendances.userId, userId),
    ))
    .limit(1);

  return { allowed: Boolean(attendance), isHost: false };
}

async function canAccessNote(note: typeof meetingNotes.$inferSelect, userId: string, isSuperAdmin = false) {
  if (!note.meetingId) return note.createdBy === userId;
  const access = await getMeetingAccess(note.meetingId, userId, isSuperAdmin);
  return access.allowed && (note.createdBy === userId || note.isShared || access.isHost || isSuperAdmin);
}

export async function getMeetingNotes(filter: { meetingId?: string; programmeId?: string; section?: string; query?: string }) {
  const session = await getServerSession();
  if (!session?.user?.id) return [];

  if (filter.meetingId) {
    const access = await getMeetingAccess(filter.meetingId, session.user.id, session.user.isSuperAdmin);
    if (!access.allowed) return [];
  }

  const conds: any[] = [];
  if (filter.meetingId) conds.push(eq(meetingNotes.meetingId, filter.meetingId));
  if (filter.programmeId) conds.push(eq(meetingNotes.programmeId, filter.programmeId));
  if (filter.section) conds.push(eq(meetingNotes.section, filter.section as any));
  if (filter.query) conds.push(like(meetingNotes.plainText, `%${filter.query}%`));

  // If we are looking at general notes, scope it strictly to the current user
  if (!filter.meetingId && !filter.programmeId) {
      conds.push(eq(meetingNotes.createdBy, session.user.id));
  } else {
      // In a meeting/programme context, show user's notes + shared notes
      conds.push(
          or(
              eq(meetingNotes.createdBy, session.user.id),
              eq(meetingNotes.isShared, true)
          )
      );
  }

  const rows = await db
    .select({ note: meetingNotes, creator: users })
    .from(meetingNotes)
    .leftJoin(users, eq(meetingNotes.createdBy, users.id))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(meetingNotes.updatedAt));

  return rows.map((r) => ({ ...r.note, creator: r.creator }));
}

export async function getNote(id: string) {
  const session = await getServerSession();
  if (!session?.user?.id) return null;
  const [row] = await db.select().from(meetingNotes).where(eq(meetingNotes.id, id)).limit(1);
  if (!row || !(await canAccessNote(row, session.user.id, session.user.isSuperAdmin))) return null;
  return row;
}

export async function upsertMeetingNote(data: z.infer<typeof NoteSchema> & { id?: string; createSnapshot?: boolean }) {
  const session = await getServerSession();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  const parsed = NoteSchema.parse(data);

  if (data.id) {
    const [existing] = await db.select().from(meetingNotes).where(eq(meetingNotes.id, data.id)).limit(1);
    if (!existing) return { success: false, error: "Note not found" };
    if (!(await canAccessNote(existing, session.user.id, session.user.isSuperAdmin))) {
      return { success: false, error: "You do not have access to this note" };
    }
    
    // Only take a version snapshot if explicitly requested (e.g. milestone or manual snapshot)
    if (data.createSnapshot) {
      await db.insert(meetingNoteVersions).values({
        noteId: existing.id,
        content: existing.content as any,
        html: existing.html as any,
        version: existing.version ?? 1,
        createdBy: session.user.id,
        createdAt: new Date(),
      });
    }

    await db
      .update(meetingNotes)
      .set({
        title: parsed.title,
        section: parsed.section as any,
        content: parsed.content as any,
        html: parsed.html || null,
        plainText: parsed.plainText || null,
        isShared: parsed.isShared ?? existing.isShared,
        updatedBy: session.user.id,
        version: data.createSnapshot ? (existing.version ?? 1) + 1 : existing.version ?? 1,
        updatedAt: new Date(),
      })
      .where(eq(meetingNotes.id, data.id));

    return { success: true, id: data.id };
  } else {
    if (parsed.meetingId) {
      const access = await getMeetingAccess(parsed.meetingId, session.user.id, session.user.isSuperAdmin);
      if (!access.allowed) return { success: false, error: "You do not have access to this meeting" };
    }
    const id = crypto.randomUUID();
    await db.insert(meetingNotes).values({
      id,
      meetingId: parsed.meetingId || null,
      programmeId: parsed.programmeId || null,
      title: parsed.title,
      section: parsed.section as any,
      content: parsed.content as any,
      html: parsed.html || null,
      plainText: parsed.plainText || null,
      createdBy: session.user.id,
      isShared: parsed.isShared ?? false,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return { success: true, id };
  }
}

export async function deleteMeetingNote(id: string) {
  const session = await getServerSession();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  const [note] = await db.select().from(meetingNotes).where(eq(meetingNotes.id, id)).limit(1);
  if (!note || !(await canAccessNote(note, session.user.id, session.user.isSuperAdmin))) {
    return { success: false, error: "You do not have access to this note" };
  }
  await db.delete(meetingNotes).where(eq(meetingNotes.id, id));
  revalidatePath(`/dashboard/meetings`);
  return { success: true };
}

export async function toggleShareNote(id: string) {
  const session = await getServerSession();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  const [note] = await db.select().from(meetingNotes).where(eq(meetingNotes.id, id)).limit(1);
  if (!note) return { success: false, error: "Not found" };
  if (!(await canAccessNote(note, session.user.id, session.user.isSuperAdmin))) {
    return { success: false, error: "You do not have access to this note" };
  }
  await db.update(meetingNotes).set({ isShared: !note.isShared, updatedAt: new Date() }).where(eq(meetingNotes.id, id));
  return { success: true, isShared: !note.isShared };
}

export async function searchNotes(query: string, meetingId?: string, programmeId?: string) {
  if (!query.trim()) return [];
  const session = await getServerSession();
  if (!session?.user?.id) return [];
  if (meetingId) {
    const access = await getMeetingAccess(meetingId, session.user.id, session.user.isSuperAdmin);
    if (!access.allowed) return [];
  }
  const conds: any[] = [like(meetingNotes.plainText, `%${query}%`)];
  if (meetingId) conds.push(eq(meetingNotes.meetingId, meetingId));
  if (programmeId) conds.push(eq(meetingNotes.programmeId, programmeId));
  conds.push(or(eq(meetingNotes.createdBy, session.user.id), eq(meetingNotes.isShared, true)));
  const rows = await db
    .select()
    .from(meetingNotes)
    .where(and(...conds))
    .orderBy(desc(meetingNotes.updatedAt))
    .limit(20);
  return rows;
}

export async function getNoteVersions(noteId: string) {
  const session = await getServerSession();
  if (!session?.user?.id) return [];
  const [note] = await db.select().from(meetingNotes).where(eq(meetingNotes.id, noteId)).limit(1);
  if (!note || !(await canAccessNote(note, session.user.id, session.user.isSuperAdmin))) return [];
  return db.select().from(meetingNoteVersions).where(eq(meetingNoteVersions.noteId, noteId)).orderBy(desc(meetingNoteVersions.version));
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function restoreNoteVersion(noteId: string, version: number) {
  const session = await getServerSession();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  const [note] = await db.select().from(meetingNotes).where(eq(meetingNotes.id, noteId)).limit(1);
  if (!note || !(await canAccessNote(note, session.user.id, session.user.isSuperAdmin))) {
    return { success: false, error: "You do not have access to this note" };
  }
  const [snapshot] = await db.select()
    .from(meetingNoteVersions)
    .where(and(eq(meetingNoteVersions.noteId, noteId), eq(meetingNoteVersions.version, version)))
    .limit(1);
  if (!snapshot) return { success: false, error: "Version not found" };

  // Snapshot the current state before overwriting, so the restore itself is reversible
  await db.insert(meetingNoteVersions).values({
    noteId,
    content: note.content as any,
    html: note.html as any,
    version: note.version ?? 0,
    createdBy: session.user.id,
    createdAt: new Date(),
  });

  const html = snapshot.html || "";
  const plainText = stripHtml(html);
  await db.update(meetingNotes)
    .set({
      html: html || null,
      content: (snapshot.content as any) ?? null,
      plainText: plainText || null,
      updatedBy: session.user.id,
      version: (note.version ?? 0) + 1,
      updatedAt: new Date(),
    })
    .where(eq(meetingNotes.id, noteId));

  revalidatePath(`/dashboard/meetings`);
  return { success: true, version: (note.version ?? 0) + 1, html, plainText };
}

export async function seedMeetingNotesTemplate(meetingId: string, meetingTitle?: string) {
  const session = await getServerSession();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  const access = await getMeetingAccess(meetingId, session.user.id, session.user.isSuperAdmin);
  if (!access.allowed) return { success: false, error: "You do not have access to this meeting" };

  const [existing] = await db.select({ id: meetingNotes.id }).from(meetingNotes).where(eq(meetingNotes.meetingId, meetingId)).limit(1);
  if (existing) return { success: true, seeded: false };

  const title = escapeHtml(meetingTitle || "Meeting");
  const seedPages = [
    {
      title: "Agenda",
      section: "AGENDA" as const,
      html: `<p><strong>${title}</strong></p><ul><li>Opening &amp; roll call</li><li>Reading of previous minutes</li><li>Main agenda topics</li><li>Motions &amp; decisions</li><li>Any other business</li></ul>`,
      plainText: `${meetingTitle || "Meeting"}\nOpening & roll call\nReading of previous minutes\nMain agenda topics\nMotions & decisions\nAny other business`,
    },
    {
      title: "Decisions",
      section: "DECISIONS" as const,
      html: `<p>Record each decision: what was agreed, who was involved, and when it takes effect. Tip: use <code>- [ ]</code> to start a checklist.</p>`,
      plainText: "Record each decision: what was agreed, who was involved, and when it takes effect.",
    },
    {
      title: "Action Items",
      section: "ACTIONS" as const,
      html: `<p>Turn outcomes into task: owner + deadline per item. Use the <strong>Action items</strong> panel above, or a checklist on this page.</p>`,
      plainText: "Turn outcomes into task: owner + deadline per item.",
    },
  ];

  for (const page of seedPages) {
    await db.insert(meetingNotes).values({
      id: crypto.randomUUID(),
      meetingId,
      title: page.title,
      section: page.section,
      content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "" }] }] } as any,
      html: page.html,
      plainText: page.plainText,
      createdBy: session.user.id,
      isShared: false,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  revalidatePath(`/dashboard/meetings`);
  return { success: true, seeded: true };
}
