export const dynamic = "force-dynamic";
import { getServerSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, LayoutDashboard, ArrowLeft, PhoneCall, CheckCircle2, Megaphone, Sparkles, User } from "lucide-react";

const STEPS = [
  { icon: Trophy, title: "1. Create a Contest", body: "New Contest → title, category (Quran/Debate/Written), level, format. Tick Payment Required to set a fee + early-bird. Saved as Draft; phases auto-generate." },
  { icon: LayoutDashboard, title: "2. Open the Contest", body: "On Manage → Open. It becomes public and jurisdictions are notified to submit representatives." },
  { icon: Trophy, title: "3. Submit Representatives", body: "Participating jurisdictions type each participant's name (one per line) and Submit. Paystack fee (early-bird locked) if required." },
  { icon: LayoutDashboard, title: "4. Generate Timetable", body: "On a phase → Manage → Generate Timetable. Builds the call queue with 5-minute slots." },
  { icon: PhoneCall, title: "5. Live Session", body: "Open Live Session → Call Next brings a participant on stage. They join the video room and perform." },
  { icon: CheckCircle2, title: "6. Judges Score", body: "Use the Score Card sliders (criteria per category) → Submit Score → Complete the call. For Written contests, a timed editor replaces the room." },
  { icon: Megaphone, title: "7. Results & Promote", body: "Compute / Auto-Promote ranks participants and advances the top 3 to the next phase. Announce the winners to the whole organisation." },
];

export default async function ContestGuidePage() {
  const session = await getServerSession();
  if (!session?.user?.id) redirect("/auth/signin");

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Hero */}
          <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-700 to-teal-800 text-white shadow-xl">
            <div className="p-8 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <Badge className="bg-white/20 text-white mb-3"><Sparkles className="h-3.5 w-3.5 mr-1" /> Admin Guide</Badge>
                <h2 className="text-3xl font-extrabold tracking-tight">Contest Module — User Guide</h2>
                <p className="text-emerald-100 mt-2 max-w-2xl">Run live Quran / Debate / Written competitions across the organisation — with payment, a calling queue, judge grading, and phased promotion to a national final.</p>
              </div>
              <Button asChild variant="secondary" className="shrink-0 bg-white text-emerald-800 hover:bg-emerald-50">
                <Link href="/dashboard/contests"><ArrowLeft className="h-4 w-4 mr-2" />Back to Contests</Link>
              </Button>
            </div>
          </div>

          {/* Flow strip */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <b>Flow:</b> Create → Open → Jurisdictions submit reps → Generate Timetable → Live Session (Call Next → room → judge scores) → Compute Results → auto-promote top 3 → next phase (Branch → LGA → State → National) → Final winner. Written contests use a timed answer editor.
          </div>

          {/* Steps */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">How it works</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {STEPS.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.title} className="rounded-xl border border-emerald-100 bg-white p-5 shadow-sm space-y-2 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2.5">
                      <span className="h-9 w-9 rounded-lg bg-emerald-600 grid place-items-center text-white"><Icon className="h-5 w-5" /></span>
                      <span className="font-bold text-gray-900">{s.title}</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{s.body}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment */}
          <div className="rounded-xl border border-emerald-100 bg-white p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <span className="h-9 w-9 rounded-lg bg-amber-500 grid place-items-center text-white"><Megaphone className="h-5 w-5" /></span>
              <h3 className="font-bold text-gray-900">Payment (if you charge a fee)</h3>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">Tick <b>Payment Required</b> on creation. The fee is charged per representative via Paystack (routed to the organisation's subaccount). Set an <b>Early Bird</b> amount + <b>Deadline</b> — early registrants pay the lower price, locked even if the fee rises. Payments appear in <b>Finance</b> as <code className="px-1.5 py-0.5 rounded bg-gray-100 text-amber-800 font-semibold">CONTEST_FEE</code> and in <b>Payments</b>. Installments can be enabled with a minimum amount.</p>
          </div>

          {/* Troubleshooting */}
          <div className="rounded-xl border border-emerald-100 bg-white p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <span className="h-9 w-9 rounded-lg bg-rose-500 grid place-items-center text-white"><CheckCircle2 className="h-5 w-5" /></span>
              <h3 className="font-bold text-gray-900">Troubleshooting</h3>
            </div>
            <ul className="text-sm text-gray-700 list-disc pl-6 space-y-1.5">
              <li>“Contest not open” — the contest is still Draft/Closed; Open it first.</li>
              <li>Empty queue — add representatives, then Generate Timetable.</li>
              <li>Room “not called yet” — press Call Next before the participant can join.</li>
              <li>No payment option — the contest wasn't created with Payment Required.</li>
              <li>Empty results — grade all called participants, then Compute.</li>
            </ul>
          </div>

          {/* Tips */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
            <div className="flex items-center gap-2 font-semibold mb-1"><User className="h-4 w-4" /> Tip</div>
            <p>The full guide is also stored in the repository as <code>CONTEST_USER_GUIDE.md</code>. You can also reach the general portal guide from the sidebar under <b>User Guide</b>.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
