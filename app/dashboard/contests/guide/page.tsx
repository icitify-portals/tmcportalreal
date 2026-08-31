export const dynamic = "force-dynamic";
import { getServerSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Trophy, LayoutDashboard, ArrowLeft, PhoneCall, CheckCircle2, Megaphone } from "lucide-react";

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
      <div className="p-4 md:p-8 space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Contest Module — Admin User Guide</h2>
            <p className="text-sm text-muted-foreground">Run live Quran / Debate / Written competitions across the organisation, with payment, a calling queue, judge grading, and phased promotion to a national final.</p>
          </div>
          <Button asChild variant="outline"><Link href="/dashboard/contests"><ArrowLeft className="h-4 w-4 mr-2" />Back to Contests</Link></Button>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
          <b className="text-emerald-800">Flow:</b> Create → Open → Jurisdictions submit reps → Generate Timetable → Live Session (Call Next → room → judge scores) → Compute Results → auto-promote top 3 → next phase (Branch → LGA → State → National) → Final winner. Written contests use a timed answer editor.
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {STEPS.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="border rounded-xl bg-white p-4 space-y-2">
                <div className="flex items-center gap-2 font-semibold"><Icon className="h-5 w-5 text-emerald-600" />{s.title}</div>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
              </div>
            );
          })}
        </div>

        <div className="border rounded-xl p-4 bg-white space-y-3">
          <h3 className="font-semibold">Payment (if you charge a fee)</h3>
          <p className="text-sm text-muted-foreground">Tick <b>Payment Required</b> on creation. The fee is charged per representative via Paystack (routed to the organisation's subaccount). Set an <b>Early Bird</b> amount + <b>Deadline</b> — early registrants pay the lower price, locked even if the fee rises. Payments appear in <b>Finance</b> as <code>CONTEST_FEE</code> and in <b>Payments</b>. Installments can be enabled with a minimum amount.</p>
        </div>

        <div className="border rounded-xl p-4 bg-white space-y-2">
          <h3 className="font-semibold">Troubleshooting</h3>
          <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
            <li>“Contest not open” — the contest is still Draft/Closed; Open it first.</li>
            <li>Empty queue — add representatives, then Generate Timetable.</li>
            <li>Room “not called yet” — press Call Next before the participant can join.</li>
            <li>No payment option — the contest wasn't created with Payment Required.</li>
            <li>Empty results — grade all called participants, then Compute.</li>
          </ul>
        </div>

        <div className="text-xs text-muted-foreground border rounded-lg p-3 bg-muted/30">The full guide is also stored in the repository as <code>CONTEST_USER_GUIDE.md</code>.</div>
      </div>
    </DashboardLayout>
  );
}
