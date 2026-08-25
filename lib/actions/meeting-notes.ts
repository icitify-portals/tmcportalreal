"use server";

import { db } from "@/lib/db";
import { meetingNotes, meetingNoteVersions, meetings, programmes, users } from "@/lib/db/schema";
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

export async function getMeetingNotes(filter: { meetingId?: string; programmeId?: string; section?: string; query?: string }) {
  const session = await getServerSession();
  if (!session?.user?.id) return [];

  const conds: any[] = [];
  if (filter.meetingId) conds.push(eq(meetingNotes.meetingId, filter.meetingId));
  if (filter.programmeId) conds.push(eq(meetingNotes.programmeId, filter.programmeId));
  if (filter.section) conds.push(eq(meetingNotes.section, filter.section as any));
  if (filter.query) conds.push(like(meetingNotes.plainText, `%${filter.query}%`));

  // If not shared filter, show own + shared
  // For simplicity return all in scope; shared handled via isShared flag in UI

  const rows = await db
    .select({ note: meetingNotes, creator: users })
    .from(meetingNotes)
    .leftJoin(users, eq(meetingNotes.createdBy, users.id))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(meetingNotes.updatedAt));

  return rows.map((r) => ({ ...r.note, creator: r.creator }));
}

export async function getNote(id: string) {
  const [row] = await db.select().from(meetingNotes).where(eq(meetingNotes.id, id)).limit(1);
  return row || null;
}

export async function upsertMeetingNote(data: z.infer<typeof NoteSchema> & { id?: string }) {
  const session = await getServerSession();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  const parsed = NoteSchema.parse(data);

  if (data.id) {
    const [existing] = await db.select().from(meetingNotes).where(eq(meetingNotes.id, data.id)).limit(1);
    if (!existing) return { success: false, error: "Note not found" };
    // version snapshot
    await db.insert(meetingNoteVersions).values({
      noteId: existing.id,
      content: existing.content as any,
      html: existing.html as any,
      version: existing.version ?? 1,
      createdBy: session.user.id,
      createdAt: new Date(),
    });
    const [updated] = await db
      .update(meetingNotes)
      .set({
        title: parsed.title,
        section: parsed.section as any,
        content: parsed.content as any,
        html: parsed.html || null,
        plainText: parsed.plainText || null,
        isShared: parsed.isShared ?? existing.isShared,
        updatedBy: session.user.id,
        version: (existing.version ?? 1) + 1,
        updatedAt: new Date(),
      })
      .where(eq(meetingNotes.id, data.id));
    revalidatePath(`/dashboard/meetings`);
    return { success: true, id: data.id };
  } else {
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
    revalidatePath(`/dashboard/meetings`);
    return { success: true, id };
  }
}

export async function deleteMeetingNote(id: string) {
  const session = await getServerSession();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  await db.delete(meetingNotes).where(eq(meetingNotes.id, id));
  revalidatePath(`/dashboard/meetings`);
  return { success: true };
}

export async function toggleShareNote(id: string) {
  const [note] = await db.select().from(meetingNotes).where(eq(meetingNotes.id, id)).limit(1);
  if (!note) return { success: false, error: "Not found" };
  await db.update(meetingNotes).set({ isShared: !note.isShared, updatedAt: new Date() }).where(eq(meetingNotes.id, id));
  return { success: true, isShared: !note.isShared };
}

export async function searchNotes(query: string, meetingId?: string, programmeId?: string) {
  if (!query.trim()) return [];
  const conds: any[] = [like(meetingNotes.plainText, `%${query}%`)];
  if (meetingId) conds.push(eq(meetingNotes.meetingId, meetingId));
  if (programmeId) conds.push(eq(meetingNotes.programmeId, programmeId));
  const rows = await db
    .select()
    .from(meetingNotes)
    .where(and(...conds))
    .orderBy(desc(meetingNotes.updatedAt))
    .limit(20);
  return rows;
}

export async function getNoteVersions(noteId: string) {
  return db.select().from(meetingNoteVersions).where(eq(meetingNoteVersions.noteId, noteId)).orderBy(desc(meetingNoteVersions.version));
}
