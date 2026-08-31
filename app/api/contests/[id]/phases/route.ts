import { NextRequest, NextResponse } from "next/server";
import { getContestPhases } from "@/lib/actions/contests";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const phases = await getContestPhases(id);
    return NextResponse.json(phases);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
