"use client";

import { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { submitWritten } from "@/lib/actions/contests";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Send, Timer, Loader2, CheckCircle } from "lucide-react";

export function WrittenEditor({ phaseId, participantId, prompt, durationSec = 1800 }: { phaseId: string; participantId: string; prompt?: string; durationSec?: number }) {
  const [secondsLeft, setSecondsLeft] = useState(durationSec);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const editor = useEditor({ extensions: [StarterKit], content: "<p></p>", immediatelyRender: false });

  useEffect(() => {
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) { clearInterval(t); autoSubmit(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  async function autoSubmit() {
    if (!editor || submitted) return;
    const html = editor.getHTML();
    const plain = editor.getText();
    await submitWritten(phaseId, participantId, editor.getJSON(), html, plain, prompt);
    setSubmitted(true);
    toast.warning("Time up — answer auto-submitted");
  }

  async function onSubmit() {
    if (!editor) return;
    setSubmitting(true);
    const res: any = await submitWritten(phaseId, participantId, editor.getJSON(), editor.getHTML(), editor.getText(), prompt);
    if (res.success) { setSubmitted(true); toast.success("Written answer submitted"); }
    else toast.error(res.error || "Failed");
    setSubmitting(false);
  }

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-sm">Written Contest</h4>
          {prompt && <p className="text-xs text-muted-foreground mt-1 bg-amber-50 border p-2 rounded">{prompt}</p>}
        </div>
        <div className={`flex items-center gap-2 font-bold text-lg px-4 py-2 rounded-lg border ${secondsLeft < 60 ? "bg-red-50 text-red-700 border-red-200" : "bg-gray-50"}`}>
          <Timer className="h-4 w-4" />{mins}:{String(secs).padStart(2, "0")}
        </div>
      </div>

      {submitted ? (
        <div className="p-8 text-center rounded-lg border border-emerald-200 bg-emerald-50">
          <CheckCircle className="h-10 w-10 text-emerald-600 mx-auto mb-2" />
          <p className="font-semibold text-emerald-800">Answer submitted</p>
        </div>
      ) : (
        <>
          <div className="border rounded-xl overflow-hidden bg-white">
            <EditorContent editor={editor} className="prose prose-sm max-w-none p-4 min-h-[280px]" />
          </div>
          <Button onClick={onSubmit} disabled={submitting} className="w-full bg-emerald-700 hover:bg-emerald-800">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}Submit Answer</Button>
        </>
      )}
    </div>
  );
}
