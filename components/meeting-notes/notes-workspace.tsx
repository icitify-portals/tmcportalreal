"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Placeholder } from "@tiptap/extension-placeholder";
import { generateNoteSummary } from "@/lib/actions/ai-notes";
import { exportDocxAction } from "@/lib/actions/export-docx";
import { saveAs } from "file-saver";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { upsertMeetingNote, deleteMeetingNote, toggleShareNote } from "@/lib/actions/meeting-notes";
import { Bold, Italic, Heading2, List, ListOrdered, ListTodo, Quote, History, Share2, Trash2, Download, Search, Plus, FileText, CheckSquare, StickyNote, Sparkles } from "lucide-react";
import jsPDF from "jspdf";
import { ActionItemsPanel } from "@/components/meeting-notes/action-items-panel";
import { VersionHistoryDialog } from "@/components/meeting-notes/version-history-dialog";
import { AiSummaryDialog } from "@/components/meeting-notes/ai-summary-dialog";

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
  initialActionItems,
  attendees,
}: {
  initialNotes: any[];
  meetingId?: string;
  programmeId?: string;
  meetingTitle?: string;
  initialActionItems?: any[];
  attendees?: { id: string; name: string | null; email: string | null }[];
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [showActionItems, setShowActionItems] = useState(false);
  const [section, setSection] = useState<string>("GENERAL");
  const [selectedId, setSelectedId] = useState<string | null>(initialNotes[0]?.id || null);
  const [title, setTitle] = useState(initialNotes[0]?.title || "Untitled note");
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const saveRef = useRef<NodeJS.Timeout | null>(null);
  const [saving, setSaving] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historySession, setHistorySession] = useState(0);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiSession, setAiSession] = useState(0);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiPreviewHtml, setAiPreviewHtml] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const selected = notes.find((n) => n.id === selectedId) || null;
  const filtered = notes.filter((n) => n.section === section);
  const searched = query ? notes.filter((n) => n.title.toLowerCase().includes(query.toLowerCase()) || (n.plainText || "").toLowerCase().includes(query.toLowerCase())) : filtered;

  const currentNoteIdRef = useRef<string | null>(selectedId);
  useEffect(() => {
    currentNoteIdRef.current = selectedId;
  }, [selectedId]);

  const currentTitleRef = useRef(title);
  useEffect(() => {
    currentTitleRef.current = title;
  }, [title]);

  const currentSectionRef = useRef(section);
  useEffect(() => {
    currentSectionRef.current = section;
  }, [section]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image,
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: "Start typing your note, meeting minutes or discussion points…" }),
    ],
    content: selected?.content || selected?.html || "<p></p>",
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const activeId = currentNoteIdRef.current;
      if (!activeId) return;
      const html = editor.getHTML();
      const json = editor.getJSON();
      const plain = editor.getText();
      setSaving(true);
      if (saveRef.current) clearTimeout(saveRef.current);
      saveRef.current = setTimeout(() => {
        startTransition(async () => {
          const res = await upsertMeetingNote({
            id: activeId,
            meetingId: meetingId || null,
            programmeId: programmeId || null,
            title: currentTitleRef.current,
            section: currentSectionRef.current as any,
            content: json as any,
            html,
            plainText: plain.slice(0, 4000),
          });
          if (res.success) {
            setNotes((prev) => prev.map((p) => p.id === activeId ? { ...p, html, content: json, plainText: plain, title: currentTitleRef.current } : p));
          }
          setSaving(false);
        });
      }, 500);
    },
  });

  // Track which note is currently loaded into the editor
  const loadedNoteIdRef = useRef<string | null>(initialNotes[0]?.id || null);

  useEffect(() => {
    if (!editor || !selectedId) return;
    if (loadedNoteIdRef.current === selectedId) return;
    loadedNoteIdRef.current = selectedId;
    const note = notes.find((n) => n.id === selectedId);
    if (note) {
      editor.commands.setContent((note.content as any) || note.html || "<p></p>");
      setTitle(note.title);
    }
  }, [selectedId, editor]);

  async function createNote() {
    const newTitle = `Note ${filtered.length + 1} — ${section}`;
    const seedContent = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Start writing…" }] }] };
    const res = await upsertMeetingNote({
      meetingId: meetingId || null,
      programmeId: programmeId || null,
      title: newTitle,
      section: section as any,
      content: seedContent as any,
      html: "<p>Start writing…</p>",
      plainText: "Start writing…",
    });
    if (res.success && res.id) {
      const newNote = {
        id: res.id,
        title: newTitle,
        section,
        html: "<p>Start writing…</p>",
        content: seedContent as any,
        plainText: "Start writing…",
        isShared: false,
        createdBy: "",
        updatedAt: new Date().toISOString()
      };
      setNotes((p) => [newNote as any, ...p]);
      loadedNoteIdRef.current = res.id;
      setSelectedId(res.id);
      setTitle(newTitle);
      if (editor) {
        editor.commands.setContent(seedContent);
        editor.commands.focus();
      }
      toast.success("New page created");
    } else {
      toast.error(res.error || "Could not create note");
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

  async function handleAI() {
    const source = selected?.plainText || "";
    if (source.length < 10) {
      toast.error("Add more text to this page before generating a summary.");
      return;
    }
    setAiBusy(true);
    setAiPreviewHtml(null);
    setAiError(null);
    setAiSession((s) => s + 1);
    setAiOpen(true);
    const res = await generateNoteSummary(source);
    setAiBusy(false);
    if (res.success) {
      setAiPreviewHtml(res.html ?? null);
    } else {
      setAiError(res.error || "AI generation failed.");
    }
  }

  async function handleAiInsert(html: string) {
    if (!editor) return;
    editor.chain().focus("end").insertContent(html).run();
    toast.success("Summary inserted at the end of this page");
  }

  async function handleAiSave(title: string, section: string, html: string) {
    if (!meetingId && !programmeId) {
      toast.error("No meeting or programme context to save this page into");
      return;
    }
    const plainText = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const res = await upsertMeetingNote({
      meetingId: meetingId || null,
      programmeId: programmeId || null,
      title,
      section: section as any,
      html,
      plainText,
      isShared: false,
      content: null as any,
    });
    if (!res.success || !res.id) {
      toast.error(res.error || "Could not save the summary page");
      return;
    }
    const newNote = {
      id: res.id,
      title,
      section,
      html,
      plainText,
      content: null,
      isShared: false,
      createdBy: "",
      updatedAt: new Date().toISOString(),
    };
    setNotes((current) => [newNote as any, ...current]);
    setSection(section);
    setSelectedId(res.id);
    toast.success("Summary saved as a new page");
  }

  async function handleRestore(html: string, plainText: string) {
    if (!selectedId || !editor) return;
    setNotes((prev) => prev.map((p) => p.id === selectedId ? { ...p, html, plainText, content: null } : p));
    editor.commands.setContent(html || "<p></p>");
    toast.success("Page restored");
  }

  async function handleMeetingRecap() {
    if (!meetingId) return;
    const sourceText = notes
      .filter((note) => note.plainText)
      .map((note) => `${note.section}: ${note.title}\n${note.plainText}`)
      .join("\n\n")
      .slice(0, 12000);

    if (sourceText.length < 10) {
      toast.error("Add more meeting notes before generating a recap.");
      return;
    }

    toast.info("Generating meeting recap...");
    startTransition(async () => {
      const summary = await generateNoteSummary(sourceText);
      if (!summary.success) {
        toast.error(summary.error || "AI generation failed.");
        return;
      }

      const recapTitle = `${meetingTitle || "Meeting"} - AI Recap`;
      const summaryHtml = summary.html || "";
      const plainText = summaryHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      const result = await upsertMeetingNote({
        meetingId,
        title: recapTitle,
        section: "MINUTES",
        html: summaryHtml,
        plainText,
        isShared: true,
        // content intentionally left null — rich `html` is the source of truth here
        // (editor will regenerate `content` as JSON on first edit)
        content: null as any,
      });

      if (result.success && result.id) {
        setNotes((current) => [{
          id: result.id,
          title: recapTitle,
          section: "MINUTES",
          html: summaryHtml,
          plainText,
          content: null,
          isShared: true,
          createdBy: "",
          updatedAt: new Date().toISOString(),
        }, ...current]);
        setSection("MINUTES");
        setSelectedId(result.id);
        toast.success("Meeting recap saved to Minutes.");
      } else {
        toast.error(result.error || "Could not save the meeting recap.");
      }
    });
  }

  async function handleDocx() {
    if (!selected) return;
    toast.info("Preparing DOCX...");
    try {
      const html = `<h1>${meetingTitle || "Meeting"} - ${title}</h1>` + (editor?.getHTML() || selected.html || "");
      const res = await exportDocxAction(html);
      if (res.success && res.base64) {
        const byteCharacters = atob(res.base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
        saveAs(blob, `${title}.docx`);
      }
    } catch(e) {
      toast.error("Export failed");
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
            {meetingId && <Button size="sm" variant={showActionItems ? "default" : "outline"} onClick={() => setShowActionItems((current) => !current)}><CheckSquare className="h-4 w-4 mr-1" />Action items</Button>}
            {meetingId && <Button size="sm" variant="secondary" onClick={handleMeetingRecap} disabled={isPending}><Sparkles className="h-4 w-4 mr-1 text-emerald-600" />Meeting recap</Button>}
            <Button size="sm" variant="secondary" onClick={handleAI} disabled={isPending}><Sparkles className="h-4 w-4 mr-1 text-purple-500" />Summarize</Button>
            <Button size="sm" variant="outline" onClick={() => { setHistorySession((s) => s + 1); setHistoryOpen(true); }} disabled={!selectedId}><History className="h-4 w-4 mr-1" />History</Button>
            <Button size="sm" variant="outline" onClick={handleShare}><Share2 className="h-4 w-4 mr-1" />{selected?.isShared ? "Unshare" : "Share"}</Button>
            <Button size="sm" variant="outline" onClick={exportPDF}><Download className="h-4 w-4 mr-1" />PDF</Button>
            <Button size="sm" variant="outline" onClick={handleDocx}><FileText className="h-4 w-4 mr-1" />DOCX</Button>
            <Button size="sm" variant="ghost" onClick={handleDelete}><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>
        {showActionItems && meetingId && <ActionItemsPanel meetingId={meetingId} initialItems={initialActionItems || []} attendees={attendees || []} />}
        {editor && (
          <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-white px-3 py-1.5">
            <Button type="button" size="icon" variant="ghost" className={`h-7 w-7 ${editor.isActive("bold") ? "bg-accent text-accent-foreground" : ""}`} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold"><Bold className="h-4 w-4" /></Button>
            <Button type="button" size="icon" variant="ghost" className={`h-7 w-7 ${editor.isActive("italic") ? "bg-accent text-accent-foreground" : ""}`} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic"><Italic className="h-4 w-4" /></Button>
            <Button type="button" size="icon" variant="ghost" className={`h-7 w-7 ${editor.isActive("heading", { level: 2 }) ? "bg-accent text-accent-foreground" : ""}`} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading"><Heading2 className="h-4 w-4" /></Button>
            <Button type="button" size="icon" variant="ghost" className={`h-7 w-7 ${editor.isActive("bulletList") ? "bg-accent text-accent-foreground" : ""}`} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list"><List className="h-4 w-4" /></Button>
            <Button type="button" size="icon" variant="ghost" className={`h-7 w-7 ${editor.isActive("orderedList") ? "bg-accent text-accent-foreground" : ""}`} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list"><ListOrdered className="h-4 w-4" /></Button>
            <Button type="button" size="icon" variant="ghost" className={`h-7 w-7 ${editor.isActive("taskList") ? "bg-accent text-accent-foreground" : ""}`} onClick={() => editor.chain().focus().toggleTaskList().run()} title="Checklist"><ListTodo className="h-4 w-4" /></Button>
            <Button type="button" size="icon" variant="ghost" className={`h-7 w-7 ${editor.isActive("blockquote") ? "bg-accent text-accent-foreground" : ""}`} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Quote"><Quote className="h-4 w-4" /></Button>
            <span className="mx-1 hidden text-xs text-muted-foreground sm:inline">Checklist: type <code>- [ ]</code> at a line start</span>
          </div>
        )}
        <div className="flex-1 overflow-auto p-4 bg-[#fbfbfb]">
          {editor ? <EditorContent editor={editor} className="prose prose-slate prose-headings:text-black prose-p:text-gray-900 max-w-none bg-white rounded-xl border p-4 min-h-[400px] shadow-sm focus:outline-none focus-within:ring-2 focus-within:ring-emerald-500/20" /> : null}
          <div className="mt-4 rounded-lg border bg-amber-50 p-3 text-xs">
            <b>Tip:</b> Use sections like OneNote — Agenda before meeting, Minutes during, Actions after. Checklist: type <code>- [ ]</code> at line start. Paste images, drag files. Every keystroke auto-saves (800ms). Shared pages visible to meeting attendees.
          </div>
        </div>
      </div>
      <VersionHistoryDialog
        key={historySession}
        noteId={selectedId}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        onRestored={handleRestore}
      />
      {selected && (
        <AiSummaryDialog
          key={aiSession}
          open={aiOpen}
          onOpenChange={setAiOpen}
          busy={aiBusy}
          previewHtml={aiPreviewHtml}
          error={aiError}
          sourceTitle={selected.title || "Note"}
          section={section}
          onInsert={handleAiInsert}
          onSave={handleAiSave}
        />
      )}
    </div>
  );
}
