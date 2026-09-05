"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, RefreshCw, Zap, BookOpen } from "lucide-react";
import { getAttemptLeaderboard } from "@/lib/actions/contest-quiz";

export function QuizLeaderboard({ quizId, mode }: { quizId: string; mode: "LIVE_SYNC_RACE" | "ASYNC_STANDARD" }) {
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        setLoading(true);
        const r = await getAttemptLeaderboard(quizId);
        setRows((r as any[]) || []);
        setLoading(false);
    }, [quizId]);

    useEffect(() => {
        refresh();
        const t = setInterval(refresh, 15000);
        return () => clearInterval(t);
    }, [refresh]);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    {mode === "LIVE_SYNC_RACE" ? <Zap className="h-5 w-5 text-rose-600" /> : <BookOpen className="h-5 w-5 text-indigo-600" />}
                    Leaderboard {mode === "LIVE_SYNC_RACE" ? "(Fastest Correct Wins)" : "(Highest Score Wins)"}
                </CardTitle>
                <button onClick={refresh} className="text-xs px-2 py-1 border rounded-md hover:bg-emerald-50 inline-flex items-center gap-1">
                    <RefreshCw className="h-3 w-3" />Refresh
                </button>
            </CardHeader>
            <CardContent>
                {loading && rows.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Loading…</p>
                ) : rows.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No completed attempts yet.</p>
                ) : (
                    <div className="space-y-2">
                        {rows.slice(0, 20).map((r: any, i: number) => (
                            <div key={r.attemptId} className={`flex items-center justify-between p-3 rounded-lg border ${i === 0 ? "bg-amber-50 border-amber-200" : i < 3 ? "bg-emerald-50/50 border-emerald-100" : "bg-white"}`}>
                                <div className="flex items-center gap-3">
                                    {i < 3 && <Trophy className={`h-5 w-5 ${i === 0 ? "text-amber-500" : i === 1 ? "text-gray-400" : "text-amber-700"}`} />}
                                    <span className="font-bold w-6">#{i + 1}</span>
                                    <span className="font-medium">{r.participantName ?? "—"}</span>
                                </div>
                                <div className="text-xs text-right">
                                    <div className="font-bold">{r.totalScore} pts</div>
                                    <div className="text-muted-foreground">{r.correctCount} correct • {(r.totalTimeMs / 1000).toFixed(1)}s</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
