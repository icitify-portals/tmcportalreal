export const dynamic = "force-dynamic";
import { getServerSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, BookOpen, ListChecks, ArrowLeft, Clock, Trophy, FileQuestion, BarChart3, Shield } from "lucide-react";

export default async function QuizGuidePage() {
    const session = await getServerSession();
    if (!session?.user?.id) redirect("/auth/signin");

    return (
        <DashboardLayout>
            <div className="p-4 md:p-8">
                <div className="max-w-5xl mx-auto space-y-6">
                    {/* Hero */}
                    <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-rose-700 via-amber-700 to-emerald-700 text-white shadow-xl">
                        <div className="p-8 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div>
                                <Badge className="bg-white/20 text-white mb-3">📘 Quiz Guide</Badge>
                                <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2"><ListChecks className="h-7 w-7" />Contest Quiz Module</h2>
                                <p className="text-white/90 mt-2 max-w-2xl">Two quiz modes built into the Contest Live module — a synchronous race and an asynchronous standard quiz. Both auto-grade and feed the contest leaderboard.</p>
                            </div>
                            <Button asChild variant="secondary" className="shrink-0 bg-white text-rose-800 hover:bg-rose-50">
                                <Link href="/dashboard/contests/guide"><ArrowLeft className="h-4 w-4 mr-2" />Contest Guide</Link>
                            </Button>
                        </div>
                    </div>

                    {/* Overview */}
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                        <b>What this is:</b> Inside any contest phase (e.g. State Quran Final), admins can publish a quiz. Representatives registered for that phase take the quiz, and the winner is determined either by speed (race) or score (standard). Results flow to the contest leaderboard.
                    </div>

                    {/* The two modes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-2xl border-2 border-rose-200 bg-rose-50 p-6 space-y-3">
                            <Badge className="bg-rose-600 text-white"><Zap className="h-3 w-3 mr-1" />LIVE SYNC RACE</Badge>
                            <h3 className="font-extrabold text-lg text-rose-900">First correct wins — by timing</h3>
                            <p className="text-sm text-rose-900/80">All participants see the same question. Each clicks Lock-in. The system records the submission timestamp. The winner is the person whose <b>correct</b> answer was submitted <b>fastest</b>.</p>
                            <ul className="text-sm text-rose-900/80 list-disc pl-5 space-y-1">
                                <li>Per-question countdown (e.g. 30s per question).</li>
                                <li>Feedback is shown after each submission (correct/wrong + explanation).</li>
                                <li>Order: correct count desc, then total time asc.</li>
                                <li>Best for live events like "Nationwide Quran Quiz — Final".</li>
                            </ul>
                        </div>

                        <div className="rounded-2xl border-2 border-indigo-200 bg-indigo-50 p-6 space-y-3">
                            <Badge className="bg-indigo-600 text-white"><BookOpen className="h-3 w-3 mr-1" />ASYNC STANDARD</Badge>
                            <h3 className="font-extrabold text-lg text-indigo-900">Highest total score wins</h3>
                            <p className="text-sm text-indigo-900/80">Questions answered one after another. After each submission the participant is told if they were right and why. The system scores cumulatively.</p>
                            <ul className="text-sm text-indigo-900/80 list-disc pl-5 space-y-1">
                                <li>Total time window (e.g. 60 minutes for the whole quiz).</li>
                                <li>Instant correct/wrong feedback + explanation.</li>
                                <li>Order: total score desc, then total time asc as tiebreaker.</li>
                                <li>Best for written-style assessments and large cohorts.</li>
                            </ul>
                        </div>
                    </div>

                    {/* Admin workflow */}
                    <div className="rounded-xl border border-emerald-100 bg-white p-6 shadow-sm space-y-3">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2"><Shield className="h-5 w-5 text-emerald-700" />Admin workflow — how to set up a quiz</h3>
                        <ol className="list-decimal pl-5 text-sm text-gray-900 space-y-2">
                            <li>Open <b>Dashboard → Contests Live → pick a contest → Manage</b>. On a phase card, click <b>Set up Quiz</b> (or <b>Edit Quiz</b> if one already exists).</li>
                            <li>Choose a mode: <b>Async Standard</b> or <b>Live Sync Race</b>.</li>
                            <li>Enter a title and (optionally) a description.</li>
                            <li>Set the timing: total time window for Async, per-question window for Live Race.</li>
                            <li>Add questions one by one: write the prompt, set 2–4 answer options, click the radio next to the correct answer, and (optionally) add an explanation.</li>
                            <li>Click <b>Publish Quiz</b>. Only representatives registered for that phase can take it.</li>
                        </ol>
                    </div>

                    {/* Participant workflow */}
                    <div className="rounded-xl border border-emerald-100 bg-white p-6 shadow-sm space-y-3">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2"><FileQuestion className="h-5 w-5 text-emerald-700" />Participant workflow</h3>
                        <ol className="list-decimal pl-5 text-sm text-gray-900 space-y-2">
                            <li>Sign in. Open the phase's Live page or visit <code className="px-1.5 py-0.5 rounded bg-gray-100 text-rose-800">/contests-live/&lt;contest&gt;/quiz/&lt;phase&gt;</code>.</li>
                            <li>Confirm your name appears as the registered representative.</li>
                            <li>Press <b>Start</b> to begin the attempt (only one attempt allowed by default).</li>
                            <li>Answer each question. The submit timestamp is captured automatically.</li>
                            <li>After the last question, click <b>Finish</b>. Your result appears immediately and is added to the leaderboard.</li>
                        </ol>
                    </div>

                    {/* Winner determination */}
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm space-y-3">
                        <h3 className="font-bold text-amber-900 flex items-center gap-2"><Trophy className="h-5 w-5" />How the winner is determined</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-amber-900">
                            <div>
                                <b>LIVE SYNC RACE</b>
                                <ol className="list-decimal pl-5 mt-1 space-y-1">
                                    <li>Correct count (higher wins).</li>
                                    <li>Tiebreak: total time used (lower wins).</li>
                                </ol>
                            </div>
                            <div>
                                <b>ASYNC STANDARD</b>
                                <ol className="list-decimal pl-5 mt-1 space-y-1">
                                    <li>Total points (higher wins).</li>
                                    <li>Tiebreak: total time used (lower wins).</li>
                                </ol>
                            </div>
                        </div>
                        <p className="text-xs text-amber-900/80 mt-3">The admin leaderboard updates automatically every 15 seconds while the quiz is running.</p>
                    </div>

                    {/* Tips + troubleshooting */}
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 shadow-sm space-y-3">
                        <h3 className="font-bold text-rose-900 flex items-center gap-2"><Clock className="h-5 w-5" />Tips & troubleshooting</h3>
                        <ul className="list-disc pl-5 text-sm text-rose-900 space-y-1">
                            <li>Each question needs at least 2 options and one marked correct, otherwise it won't save.</li>
                            <li>The participant must already be a registered representative for the phase — otherwise the quiz is locked.</li>
                            <li>Wrong answer in LIVE mode still spends time — encourage participants to confirm before clicking Lock-in.</li>
                            <li>The admin can edit questions anytime, but changes don't affect attempts that are already in progress.</li>
                            <li>To replay or re-test, change the attempt policy (maxAttempts) before publishing.</li>
                        </ul>
                    </div>

                    {/* Where to find */}
                    <div className="rounded-xl border border-emerald-100 bg-white p-6 shadow-sm space-y-3">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2"><BarChart3 className="h-5 w-5 text-emerald-700" />Where to find the quiz in the portal</h3>
                        <ul className="list-disc pl-5 text-sm text-gray-900 space-y-1">
                            <li>Admins: <Link href="/dashboard/contests" className="text-emerald-700 underline">Contests Live</Link> → contest → Manage → on a phase, click <b>Set up Quiz</b>.</li>
                            <li>Admins (live leaderboard): on the same quiz page, the leaderboard refreshes every 15 seconds.</li>
                            <li>Participants: open the contest's Live phase page → <b>Take Quiz</b>.</li>
                            <li>General guide: <Link href="/dashboard/guide" className="text-emerald-700 underline">User Guide (all modules)</Link>.</li>
                            <li>Contest workflow: <Link href="/dashboard/contests/guide" className="text-emerald-700 underline">Contest Guide</Link>.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
