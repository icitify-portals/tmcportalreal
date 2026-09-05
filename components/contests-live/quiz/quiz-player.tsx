"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Clock, Zap, BookOpen, Trophy, ChevronRight, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { startAttempt, submitAnswer, finishAttempt } from "@/lib/actions/contest-quiz";

interface QuestionOption { id: string; label: string; optionNo: number }
interface Question { id: string; prompt: string; imageUrl?: string | null; points?: number | null; options: QuestionOption[]; correctOptionId?: string | null; explanation?: string | null }

export function QuizPlayer({
    quizId, mode, durationSec, questionWindowSec, questions, participantId, participantName,
}: {
    quizId: string;
    mode: "LIVE_SYNC_RACE" | "ASYNC_STANDARD";
    durationSec: number;
    questionWindowSec: number;
    questions: Question[];
    participantId: string | null;
    participantName: string;
}) {
    const ordered = useMemo(() => questions, [questions]);
    const [attemptId, setAttemptId] = useState<string | null>(null);
    const [startedAtMs, setStartedAtMs] = useState<number>(0);
    const [tick, setTick] = useState(0);

    const [qIdx, setQIdx] = useState(0);
    const [questionShownAt, setQuestionShownAt] = useState<number>(0);
    const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<{ isCorrect: boolean; correctOptionId?: string; explanation?: string; pointsEarned?: number } | null>(null);
    const [answers, setAnswers] = useState<Record<string, { selectedOptionId: string | null; isCorrect: boolean; timeMs: number }>>({});
    const [finished, setFinished] = useState<{ totalScore: number; correctCount: number; totalTimeMs: number } | null>(null);
    const submitLockRef = useRef<string | null>(null);

    // Start attempt on mount
    useEffect(() => {
        if (!participantId) return;
        (async () => {
            const res: any = await startAttempt(quizId, participantId);
            if (res.success && res.attemptId) {
                setAttemptId(res.attemptId);
                if (!res.resumed) {
                    setStartedAtMs(Date.now());
                } else {
                    setStartedAtMs(Date.now());
                }
            } else {
                toast.error(res.error || "Failed to start quiz");
            }
        })();
    }, [quizId, participantId]);

    // Ticking timer
    useEffect(() => {
        const t = setInterval(() => setTick((v) => v + 1), 200);
        return () => clearInterval(t);
    }, []);

    // Standard mode timer
    useEffect(() => {
        if (mode !== "ASYNC_STANDARD") return;
        if (finished || feedback || !startedAtMs) return;
        if (Date.now() - startedAtMs >= durationSec * 1000) {
            handleFinish();
        }
    }, [tick]);

    const currentQ = ordered[qIdx];

    function timeLeftSeconds(): number {
        if (mode === "ASYNC_STANDARD") {
            return Math.max(0, durationSec - Math.floor((Date.now() - startedAtMs) / 1000));
        }
        return Math.max(0, questionWindowSec - Math.floor((Date.now() - questionShownAt) / 1000));
    }

    async function handleSubmit() {
        if (!attemptId || !currentQ) return;
        if (submitLockRef.current === currentQ.id) return;
        submitLockRef.current = currentQ.id;
        const timeMs = Date.now() - questionShownAt;
        const res: any = await submitAnswer({
            attemptId, questionId: currentQ.id,
            selectedOptionId, timeMs,
        });
        if (res.success) {
            setFeedback({ isCorrect: !!res.isCorrect, correctOptionId: res.correctOptionId, explanation: res.explanation, pointsEarned: res.pointsEarned });
            setAnswers((prev) => ({ ...prev, [currentQ.id]: { selectedOptionId, isCorrect: !!res.isCorrect, timeMs } }));
        } else {
            toast.error(res.error || "Submit failed");
        }
    }

    async function handleNext() {
        setSelectedOptionId(null);
        setFeedback(null);
        if (qIdx + 1 < ordered.length) {
            setQIdx((i) => i + 1);
            setQuestionShownAt(Date.now());
        } else {
            await handleFinish();
        }
    }

    async function handleFinish() {
        if (!attemptId) return;
        if (finished) return;
        const res: any = await finishAttempt(attemptId);
        if (res.success) {
            setFinished({ totalScore: res.totalScore, correctCount: res.correctCount, totalTimeMs: res.totalTimeMs });
            toast.success("Quiz submitted");
        }
    }

    if (!participantId) {
        return (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 flex gap-2 items-start"><AlertCircle className="h-4 w-4 mt-0.5" />No representative assigned.</div>
        );
    }

    if (finished) {
        return (
            <div className="space-y-3">
                <Card><CardContent className="p-8 text-center">
                    <Trophy className="h-14 w-14 text-amber-500 mx-auto mb-3" />
                    <h3 className="text-2xl font-extrabold text-emerald-800">Submitted</h3>
                    <p className="text-sm text-muted-foreground mt-1">{participantName} — {finished.correctCount} / {ordered.length} correct • {finished.totalScore} pts • {(finished.totalTimeMs / 1000).toFixed(0)}s</p>
                    <p className="text-xs text-muted-foreground mt-3">Results posted to leaderboard.</p>
                </CardContent></Card>
            </div>
        );
    }

    if (!currentQ) {
        return <div className="rounded-xl border p-6 text-sm">No questions yet.</div>;
    }

    const sec = timeLeftSeconds();
    const isLive = mode === "LIVE_SYNC_RACE";
    const answeredSoFar = Object.keys(answers).length;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border p-3 bg-white">
                <div className="flex items-center gap-2">
                    {isLive ? <Badge className="bg-rose-600 text-white"><Zap className="h-3 w-3 mr-1" />LIVE SYNC</Badge> : <Badge className="bg-indigo-600 text-white"><BookOpen className="h-3 w-3 mr-1" />STANDARD</Badge>}
                    <span className="text-sm font-medium">Question {qIdx + 1} of {ordered.length}</span>
                    <span className="text-xs text-muted-foreground">·  {answeredSoFar} answered</span>
                </div>
                <div className={`flex items-center gap-2 font-bold ${sec < 10 ? "text-rose-700" : "text-emerald-800"}`}>
                    <Clock className="h-4 w-4" />
                    {Math.floor(sec / 60)}:{String(sec % 60).padStart(2, "0")}
                </div>
            </div>

            <Card>
                <CardContent className="p-6 space-y-4">
                    <p className="text-base md:text-lg font-medium">{currentQ.prompt}</p>
                    {currentQ.imageUrl && <img src={currentQ.imageUrl} alt="" className="rounded-lg border max-h-72" />}

                    <div className="space-y-2">
                        {currentQ.options.map((opt) => {
                            const chosen = selectedOptionId === opt.id;
                            const showFeedback = !!feedback;
                            const isCorrectOpt = feedback?.correctOptionId === opt.id;
                            const isWrongChosen = showFeedback && chosen && !feedback?.isCorrect;
                            return (
                                <button
                                    key={opt.id}
                                    onClick={() => !showFeedback && setSelectedOptionId(opt.id)}
                                    disabled={!!feedback || sec === 0}
                                    className={`w-full text-left px-4 py-3 rounded-lg border transition-colors flex items-center justify-between ${
                                        isCorrectOpt ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                            : isWrongChosen ? "border-rose-300 bg-rose-50 text-rose-800"
                                            : chosen ? "border-emerald-500 bg-emerald-50"
                                            : "hover:bg-emerald-50/40"
                                    }`}
                                >
                                    <span>{opt.label}</span>
                                    {isCorrectOpt && <Check className="h-4 w-4" />}
                                    {isWrongChosen && <X className="h-4 w-4" />}
                                </button>
                            );
                        })}
                    </div>

                    {feedback ? (
                        <div className={`rounded-lg p-3 text-sm ${feedback.isCorrect ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>
                            <b>{feedback.isCorrect ? `Correct! +${feedback.pointsEarned ?? 0} pts` : "Incorrect."}</b>
                            {feedback.explanation && <span className="ml-2">{feedback.explanation}</span>}
                        </div>
                    ) : (
                        <Button onClick={handleSubmit} disabled={!selectedOptionId || sec === 0} className="w-full bg-emerald-700 hover:bg-emerald-800">
                            {isLive ? "Lock in" : "Submit answer"}
                        </Button>
                    )}

                    {feedback && (
                        <Button onClick={handleNext} variant="outline" className="w-full">
                            {qIdx + 1 < ordered.length ? <>Next question <ChevronRight className="h-4 w-4 ml-1" /></> : <>Finish quiz <Trophy className="h-4 w-4 ml-1" /></>}
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
