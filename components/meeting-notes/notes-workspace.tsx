"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
// import Placeholder from "@tiptap/extension-placeholder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { upsertMeetingNote, deleteMeetingNote, toggleShareNote, searchNotes } from "@/lib/actions/meeting-notes";
import { Save, Share2, Trash2, Download, Search, Plus, FileText, CheckSquare, StickyNote } from "lucide-react";
import jsPDF from "jspdf";

const SECTIONS = [
  { key: "GENERAL", label: "General", icon: StickyNote, color: "bg-gray-100" },
  { key: "AGENDA", label: "Agenda", icon: FileText, color: "bg-blue-100" },
  { key: "MINUTES", label: "Minutes", icon: FileText, color: "bg-emerald-100" },
  { key: "DECISIONS", label: "Decisions", icon: CheckSquare, color: "bg-amber-100" },
  { key: "ACTIONS", label: "Action Items", icon: CheckSquare, color: "bg-purple-100" },
  { key: "FOLLOW_UP", label: "Follow-up", icon: StickyNote, color: "bg-rose-100" },
] as const;

export function NotesWorkspace({
  initialNotes,
  meetingId,
  programmeId,
  meetingTitle,
}: {
  initialNotes: any[];
  meetingId?: string;
  programmeId?: string;
  meetingTitle?: string;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [section, setSection] = useState<string>("GENERAL");
  const [selectedId, setSelectedId] = useState<string | null>(initialNotes[0]?.id || null);
  const [title, setTitle] = useState(initialNotes[0]?.title || "Untitled note");
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const saveRef = useRef<NodeJS.Timeout | null>(null);
  const [saving, setSaving] = useState(false);

  const selected = notes.find((n) => n.id === selectedId) || null;
  const filtered = notes.filter((n) => n.section === section);
  const searched = query ? notes.filter((n) => n.title.toLowerCase().includes(query.toLowerCase()) || (n.plainText || "").toLowerCase().includes(query.toLowerCase())) : filtered;

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image,
      // Placeholder.configure({ placeholder: "Start writing notes… Type / for commands, paste images, add checklists (- [ ])" }),
    ],
    content: selected?.content || selected?.html || "<p></p>",
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      if (!selectedId) return;
      const html = editor.getHTML();
      const json = editor.getJSON();
      const plain = editor.getText();
      setSaving(true);
      if (saveRef.current) clearTimeout(saveRef.current);
      saveRef.current = setTimeout(() => {
        startTransition(async () => {
          const res = await upsertMeetingNote({
            id: selectedId,
            meetingId: meetingId || null,
            programmeId: programmeId || null,
            title,
            section: section as any,
            content: json as any,
            html,
            plainText: plain.slice(0, 4000),
            isShared: selected?.isShared,
          });
          if (res.success) {
            setNotes((prev) => prev.map((p) => p.id === selectedId ? { ...p, html, content: json, plainText: plain, title } : p));
            toast.success("Auto-saved");
          }
          setSaving(false);
        });
      }, 800);
    },
  });

  useEffect(() => {
    if (selected && editor) {
      const cur = editor.getHTML();
      const next = selected.html || "";
      if (cur !== next) editor.commands.setContent(selected.content || next || "<p></p>");
      setTitle(selected.title);
    }
  }, [selectedId]);

  async function createNote() {
    const newTitle = `Note ${filtered.length + 1} — ${section}`;
    const res = await upsertMeetingNote({
      meetingId: meetingId || null,
      programmeId: programmeId || null,
      title: newTitle,
      section: section as any,
      content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Start writing…" }] }] } as any,
      html: "<p>Start writing…</p>",
      plainText: "Start writing…",
    });
    if (res.success && res.id) {
      const newNote = { id: res.id, title: newTitle, section, html: "<p>Start writing…</p>", content: null, plainText: "Start writing…", isShared: false, createdBy: "", updatedAt: new Date().toISOString() };
      setNotes((p) => [newNote, ...p]);
      setSelectedId(res.id);
      toast.success("New page created");
    }
  }

  async function handleDelete() {
    if (!selectedId) return;
    if (!confirm("Delete this note page?")) return;
    await deleteMeetingNote(selectedId);
    setNotes((p) => p.filter((n) => n.id !== selectedId));
    setSelectedId(filtered[0]?.id || null);
    toast.success("Deleted");
  }

  async function handleShare() {
    if (!selectedId) return;
    const res = await toggleShareNote(selectedId);
    if (res.success) {
      setNotes((p) => p.map((n) => n.id === selectedId ? { ...n, isShared: res.isShared } : n));
      toast.success(res.isShared ? "Shared with attendees" : "Made private");
    }
  }

  function exportPDF() {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(meetingTitle || "Meeting Notes", 14, 18);
    doc.setFontSize(10);
    doc.text(`Section: ${section} — ${title}`, 14, 26);
    const text = editor?.getText() || selected?.plainText || "";
    const lines = doc.splitTextToSize(text, 180);
    doc.text(lines, 14, 34);
    doc.save(`${(meetingTitle || "notes").replace(/\s+/g, "_")}_${section}.pdf`);
  }

  return (
    <div className="flex h-[calc(100vh-120px)] border rounded-xl overflow-hidden bg-white">
      {/* Sections rail like OneNote */}
      <div className="w-[72px] border-r bg-muted/30 flex flex-col items-center py-3 gap-2">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          const active = section === s.key;
          return (
            <button
              key={s.key}
              onClick={() => { setSection(s.key); const first = notes.find((n) => n.section === s.key); if (first) setSelectedId(first.id); }}
              className={`w-16 flex flex-col items-center gap-1 p-2 rounded-lg border text-[11px] font-semibold ${active ? "bg-emerald-600 text-white border-emerald-700 shadow" : "bg-white hover:bg-muted"}`}
              title={s.label}
            >
              <Icon className="h-4 w-4" />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Pages list */}
      <div className="w-[280px] border-r flex flex-col">
        <div className="p-3 border-b space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search notes (Ctrl+K)" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-8 h-9" />
            </div>
            <Button size="icon" variant="outline" onClick={createNote}><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="text-xs text-muted-foreground">{searched.length} pages in {section}</div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {searched.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No pages. Click + to add.</div>
            ) : searched.map((n) => (
              <button
                key={n.id}
                onClick={() => setSelectedId(n.id)}
                className={`w-full text-left p-3 rounded-lg border ${selectedId === n.id ? "bg-emerald-50 border-emerald-200" : "bg-white hover:bg-muted/50"}`}
              >
                <div className="font-medium text-sm line-clamp-1">{n.title}</div>
                <div className="text-xs text-muted-foreground line-clamp-2">{(n.plainText || "").slice(0, 80) || "Empty"}</div>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline" className="text-[10px] h-5">{n.section}</Badge>
                  {n.isShared && <Badge className="bg-blue-600 text-white text-[10px] h-5">Shared</Badge>}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-14 border-b flex items-center justify-between px-3 bg-muted/20">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} onBlur={() => { if (selectedId) upsertMeetingNote({ id: selectedId, meetingId: meetingId || null, programmeId: programmeId || null, title, section: section as any, content: editor?.getJSON() as any, html: editor?.getHTML() || "", plainText: editor?.getText() || "" } as any); }} className="max-w-md font-semibold" placeholder="Page title" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden md:inline">{saving ? "Saving…" : "Auto-saved"}</span>
            <Button size="sm" variant="outline" onClick={handleShare}><Share2 className="h-4 w-4 mr-1" />{selected?.isShared ? "Unshare" : "Share"}</Button>
            <Button size="sm" variant="outline" onClick={exportPDF}><Download className="h-4 w-4 mr-1" />PDF</Button>
            <Button size="sm" variant="ghost" onClick={handleDelete}><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4 bg-[#fbfbfb]">
          {editor ? <EditorContent editor={editor} className="prose prose-sm max-w-none bg-white rounded-xl border p-4 min-h-[400px] shadow-sm" /> : null}
          <div className="mt-4 rounded-lg border bg-amber-50 p-3 text-xs">
            <b>Tip:</b> Use sections like OneNote — Agenda before meeting, Minutes during, Actions after. Checklist: type <code>- [ ]</code> at line start. Paste images, drag files. Every keystroke auto-saves (800ms). Shared pages visible to meeting attendees.
          </div>
        </div>
      </div>
    </div>
  );
}
