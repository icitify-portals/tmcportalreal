"use client";

import { useState, useMemo } from "react";
import { GUIDES } from "@/lib/guide-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, BookOpen, ChevronRight, ChevronDown, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";

const HERO_GRADIENTS = [
  "from-emerald-700 via-emerald-800 to-green-950",
  "from-green-700 via-emerald-800 to-teal-900",
  "from-emerald-800 via-green-900 to-emerald-950",
];

export default function GuidePage() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(GUIDES[0].id);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GUIDES;
    return GUIDES.filter(
      (g) =>
        g.title.toLowerCase().includes(q) ||
        g.summary.toLowerCase().includes(q) ||
        g.sections.some((s) => s.heading.toLowerCase().includes(q) || s.body.toLowerCase().includes(q))
    );
  }, [query]);

  const activeGuide = GUIDES.find((g) => g.id === active) || GUIDES[0];
  const activeIndex = GUIDES.findIndex((g) => g.id === activeGuide.id);
  const heroGradient = HERO_GRADIENTS[Math.max(0, activeIndex) % HERO_GRADIENTS.length];

  function toggleSection(i: number) {
    setOpenSections((prev) => ({ ...prev, [i]: !prev[i] }));
  }

  const allOpen = filtered[0]?.sections?.length ? filtered[0].sections.every((_: any, i: number) => openSections[i]) : false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/60 via-background to-green-50/40">
      <div className="flex flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="lg:w-80 border-r border-emerald-100 bg-white/80 backdrop-blur lg:h-[calc(100vh-4rem)] lg:overflow-y-auto shrink-0">
          <div className="p-5 sticky top-0 bg-green-950 text-white backdrop-blur border-b border-emerald-900 z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-9 w-9 rounded-xl bg-emerald-500 grid place-items-center text-white"><BookOpen className="h-5 w-5" /></div>
              <div>
                <h1 className="font-extrabold tracking-tight leading-none">User Guide</h1>
                <p className="text-[11px] text-emerald-200/90">TMC Portal • All modules</p>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-emerald-300" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search modules…" className="pl-9 bg-emerald-950/40 border-emerald-800 text-white placeholder:text-emerald-300/70 focus-visible:ring-emerald-400" />
            </div>
          </div>
          <nav className="p-3 space-y-0.5">
            {filtered.map((g) => (
              <button
                key={g.id}
                onClick={() => { setActive(g.id); setOpenSections({}); }}
                className={cn(
                  "flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  active === g.id ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20" : "text-green-900 hover:bg-emerald-600/10 hover:text-emerald-800"
                )}
              >
                <span className={cn("h-8 w-8 rounded-lg grid place-items-center text-white shrink-0 shadow-sm", g.color)}><g.icon className="h-4 w-4" /></span>
                <span className="leading-tight">
                  <span className="block truncate">{g.title}</span>
                  <span className={cn("block text-[10px] truncate", active === g.id ? "text-emerald-50" : "text-green-700/70")}>{g.audience}</span>
                </span>
              </button>
            ))}
            {filtered.length === 0 && <p className="px-3 py-6 text-sm text-muted-foreground text-center">No modules match “{query}”.</p>}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 p-4 md:p-8 max-w-3xl">
          <div className="space-y-6">
            {/* Hero */}
            <Card className={cn("border-0 overflow-hidden bg-gradient-to-br text-white shadow-xl", heroGradient)}>
              <CardContent className="p-8">
                <Badge className="bg-white/20 text-white mb-3"><Sparkles className="h-3.5 w-3.5 mr-1" /> {activeGuide.audience}</Badge>
                <div className="flex items-center gap-4">
                  <div className={cn("h-14 w-14 rounded-2xl grid place-items-center text-white ring-2 ring-white/30", activeGuide.color)}><activeGuide.icon className="h-7 w-7" /></div>
                  <div>
                    <h2 className="text-2xl font-extrabold tracking-tight">{activeGuide.title}</h2>
                    <p className="text-emerald-100 mt-1">{activeGuide.summary}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sections */}
            {allOpen && activeGuide.sections.length > 0 && (
              <div className="flex justify-end">
                <Button size="sm" variant="outline" onClick={() => setOpenSections({})}>Collapse all</Button>
              </div>
            )}
            <div className="space-y-3">
              {activeGuide.sections.map((s, i) => {
                const open = openSections[i] ?? true;
                return (
                  <Card key={i} className="overflow-hidden border-emerald-100 bg-white shadow-sm">
                    <button className="w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-emerald-50/60 transition-colors" onClick={() => toggleSection(i)}>
                      <div className="flex items-center gap-3">
                        <span className={cn("h-7 w-7 rounded-lg grid place-items-center text-white text-xs font-bold", activeGuide.color)}>{i + 1}</span>
                        <span className="font-semibold text-green-950">{s.heading}</span>
                      </div>
                      {open ? <ChevronDown className="h-5 w-5 text-emerald-600" /> : <ChevronRight className="h-5 w-5 text-emerald-600" />}
                    </button>
                    {open && (
                      <CardContent className="px-5 pb-5 text-sm leading-relaxed text-green-900/80 bg-white">
                        <p>{s.body}</p>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
              {activeGuide.sections.length === 0 && <p className="text-sm text-muted-foreground">Nothing here yet.</p>}
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900">
              <div className="flex items-center gap-2 font-semibold mb-1"><User className="h-4 w-4" /> Tips</div>
              <ul className="list-disc pl-5 space-y-1">
                <li>Use the search box to jump straight to any module.</li>
                <li>Pick the module from the left menu; each card expands/collapses.</li>
                <li>Roles, jurisdiction and organisation settings determine what you can see or do.</li>
                <li>For the live contest workflow, see the dedicated <b>Contest Guide</b> in the sidebar.</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
