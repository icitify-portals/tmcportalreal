"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Check, ListChecks, Zap, BookOpen } from "lucide-react";
import { createQuiz, addQuestion, deleteQuestion, publishQuiz } from "@/lib/actions/contest-quiz";

interface QuizQuestion {
    id: string;
    questionNo: number;
    prompt: string;
    imageUrl?: string | null;
    points?: number | null;
    correctOptionId?: string | null;
    explanation?: string | null;
    options: { id: string; label: string; optionNo: number }[];
}

export function QuizBuilder({ phaseId, existing, participantCount }: { phaseId: string; existing: any; participantCount: number }) {
    const [mode, setMode] = useState<"LIVE_SYNC_RACE" | "ASYNC_STANDARD">(existing?.mode ?? "ASYNC_STANDARD");
    const [title, setTitle] = useState(existing?.title ?? "");
    const [description, setDescription] = useState(existing?.description ?? "");
    const [duration, setDuration] = useState<number>(existing?.durationSec ?? 60);
    const [questionWindow, setQuestionWindow] = useState<number>(existing?.questionWindowSec ?? 30);
    const [startsAt, setStartsAt] = useState(existing?.startsAt ? new Date(existing.startsAt).toISOString().slice(0, 16) : "");
    const [endsAt, setEndsAt] = useState(existing?.endsAt ? new Date(existing.endsAt).toISOString().slice(0, 16) : "");
    const [questions, setQuestions] = useState<QuizQuestion[]>(existing?.questions ?? []);
    const [pendingQ, setPendingQ] = useState({ prompt: "", explanation: "", options: ["", "", "", ""], correctIndex: 0 });
    const [isPending, startTransition] = useTransition();

    function reset() { setTitle(""); setDescription(""); setQuestions([]); setPendingQ({ prompt: "", explanation: "", options: ["", "", "", ""], correctIndex: 0 }); }

    async function handleCreateQuiz() {
        if (!title.trim()) return toast.error("Enter a quiz title");
        startTransition(async () => {
            const res: any = await createQuiz({
                phaseId, title: title.trim(), description: description.trim() || undefined,
                mode, durationSec: duration, questionWindowSec: questionWindow,
                startsAt: startsAt || undefined, endsAt: endsAt || undefined,
            });
            if (res.success) {
                toast.success("Quiz created — now add questions");
                reset();
                // Refresh to pick up the existing quiz
                setTimeout(() => window.location.reload(), 600);
            } else toast.error(res.error || "Failed");
        });
    }

    async function handleAddQuestion() {
        if (!existing) return toast.error("Create the quiz first");
        if (!pendingQ.prompt.trim()) return toast.error("Enter the question text");
        const cleanOptions = pendingQ.options.map(o => o.trim()).filter((o) => o.length > 0);
        if (cleanOptions.length < 2) return toast.error("Provide at least 2 answer options");
        if (pendingQ.correctIndex < 0 || pendingQ.correctIndex >= cleanOptions.length) return toast.error("Pick the correct answer");
        startTransition(async () => {
            const res: any = await addQuestion({
                quizId: existing.id, prompt: pendingQ.prompt.trim(),
                options: cleanOptions.map((l) => ({ label: l })),
                correctIndex: pendingQ.correctIndex,
                explanation: pendingQ.explanation.trim() || undefined,
            });
            if (res.success) {
                toast.success("Question added");
                setPendingQ({ prompt: "", explanation: "", options: ["", "", "", ""], correctIndex: 0 });
                setTimeout(() => window.location.reload(), 600);
            } else toast.error(res.error || "Failed");
        });
    }

    async function handleDelete(qid: string) {
        if (!confirm("Delete this question?")) return;
        startTransition(async () => {
            const res: any = await deleteQuestion(qid);
            if (res.success) { toast.success("Deleted"); setTimeout(() => window.location.reload(), 400); }
        });
    }

    async function handlePublish() {
        if (questions.length === 0) return toast.error("Add at least one question");
        startTransition(async () => {
            const res: any = await publishQuiz(existing.id);
            if (res.success) toast.success("Published — participants can now take the quiz");
            else toast.error(res.error || "Failed");
        });
    }

    if (!existing) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ListChecks className="h-5 w-5 text-emerald-700" /> Create Quiz</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <p className="text-sm font-semibold">Mode</p>
                            <p className="text-xs text-muted-foreground">LIVE SYNC RACE — all participants see the same question at the same time, fastest correct wins. ASYNC STANDARD — questions answered sequentially with instant feedback, highest total score wins.</p>
                        </div>
                        <Select value={mode} onValueChange={(v) => setMode(v as any)}>
                            <SelectTrigger className="w-[260px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ASYNC_STANDARD">Async Standard</SelectItem>
                                <SelectItem value="LIVE_SYNC_RACE">Live Sync Race</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div><label className="text-xs font-semibold">Title</label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. National Islamic Quiz — Final Round" /></div>

                    <div><label className="text-xs font-semibold">Description (optional)</label>
                        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold">{mode === "LIVE_SYNC_RACE" ? "Time per question (seconds)" : "Total quiz time (seconds)"}</label>
                            <Input type="number" value={duration} onChange={(e) => setDuration(parseInt(e.target.value) || 60)} />
                        </div>
                        {mode === "LIVE_SYNC_RACE" && (
                            <div>
                                <label className="text-xs font-semibold">Question reveal window (s)</label>
                                <Input type="number" value={questionWindow} onChange={(e) => setQuestionWindow(parseInt(e.target.value) || 30)} />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold">Starts at (optional)</label>
                            <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs font-semibold">Ends at (optional)</label>
                            <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
                        </div>
                    </div>

                    <Button onClick={handleCreateQuiz} disabled={isPending} className="w-full bg-emerald-700 hover:bg-emerald-800">
                        {isPending ? "Creating..." : "Create Quiz"}
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-emerald-700" /> Add Question ({questions.length} so far)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div><label className="text-xs font-semibold">Question prompt</label>
                        <Textarea value={pendingQ.prompt} onChange={(e) => setPendingQ({ ...pendingQ, prompt: e.target.value })} rows={2} /></div>

                    <div className="grid grid-cols-2 gap-3">
                        {pendingQ.options.map((opt, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <input type="radio" name="correctOption" checked={pendingQ.correctIndex === i} onChange={() => setPendingQ({ ...pendingQ, correctIndex: i })} />
                                <Input value={opt} onChange={(e) => { const next = [...pendingQ.options]; next[i] = e.target.value; setPendingQ({ ...pendingQ, options: next }); }} placeholder={`Option ${i + 1}`} />
                            </div>
                        ))}
                    </div>

                    <div><label className="text-xs font-semibold">Explanation (shown after submit)</label>
                        <Textarea value={pendingQ.explanation} onChange={(e) => setPendingQ({ ...pendingQ, explanation: e.target.value })} rows={2} /></div>

                    <Button onClick={handleAddQuestion} disabled={isPending} className="w-full bg-emerald-700 hover:bg-emerald-800">
                        {isPending ? "Adding..." : "Add Question"}
                    </Button>
                </CardContent>
            </Card>

            {questions.length > 0 && (
                <Card>
                    <CardHeader><CardTitle>Questions</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        {questions.map((q: any) => (
                            <div key={q.id} className="flex items-start gap-3 p-3 border rounded-lg bg-white">
                                <span className="h-7 w-7 rounded-lg bg-emerald-600 grid place-items-center text-white text-xs font-bold">{q.questionNo}</span>
                                <div className="flex-1">
                                    <p className="font-medium text-sm">{q.prompt}</p>
                                    <div className="mt-1 flex flex-wrap gap-1">
                                        {q.options.map((o: any) => (
                                            <Badge key={o.id} variant={o.id === q.correctOptionId ? "default" : "outline"} className={o.id === q.correctOptionId ? "bg-emerald-600" : ""}>
                                                {o.id === q.correctOptionId && <Check className="h-3 w-3 mr-1" />}{o.label}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                                <Button size="sm" variant="ghost" onClick={() => handleDelete(q.id)}><Trash2 className="h-4 w-4 text-rose-500" /></Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {!existing.published && questions.length > 0 && (
                <Button onClick={handlePublish} disabled={isPending} className="w-full bg-emerald-700 hover:bg-emerald-800">
                    {isPending ? "Publishing..." : "Publish Quiz (Make Available to Participants)"}
                </Button>
            )}

            {existing.published && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                    <b>Live:</b> Participants can now take the quiz at the published URLs. Eligible representatives: {participantCount}.
                </div>
            )}
        </div>
    );
}
