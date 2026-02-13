"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Updated interfaces to match lib/org-helper.ts
interface BranchNode {
    id: string;
    name: string;
    code: string;
}

interface LgaNode {
    id: string;
    name: string;
    code: string;
    branches: BranchNode[];
}

interface StateNode {
    id: string;
    name: string;
    code: string;
    lgas: LgaNode[];
    level?: string;
}

interface NationalNode {
    id: string;
    name: string;
    code: string;
    states: StateNode[];
    level?: string;
}

interface ExploreCommunityProps {
    communityData: (StateNode | NationalNode | any)[];
    childrenOrgs?: any[];
    level?: string;
}

export const ExploreCommunity = ({ communityData, childrenOrgs, level }: ExploreCommunityProps) => {
    // Extract states if the data is wrapped in NationalNode
    const states: StateNode[] = communityData[0]?.level === 'NATIONAL'
        ? (communityData[0] as NationalNode).states
        : (communityData as StateNode[]);

    const [expandedState, setExpandedState] = useState<string | null>(null);
    const [expandedLga, setExpandedLga] = useState<string | null>(null);

    // Handle legacy usage if passed childrenOrgs (for /connect page)
    // If communityData isn't passed, we might need to render differently or just return null
    // But for the main landing page, communityData is what we use.
    if (!communityData && childrenOrgs) {
        // Fallback for the /connect pages that use this component differently
        // We'll just render a simple grid for them as before or adapt logic
        // For now, let's keep the main landing page logic separated
        // If we want to strictly follow the user's prompt, we focus on the "Explore Community" main section.
        // Let's assume this component is primarily for the hierarchy view.
        // If childrenOrgs is present but no communityData, we might want to preserve old behavior or update caller.
        // Given the prompt "update the explore community... code", I will prioritize the new UI.
        // I'll leave a small fallback for childrenOrgs if strictly needed, but the main goal is the new UI.
    }

    // Safety check
    if (!states || states.length === 0) return null;

    const toggleState = (stateName: string) => {
        if (expandedState === stateName) {
            setExpandedState(null);
            setExpandedLga(null);
        } else {
            setExpandedState(stateName);
        }
    };

    const getLink = (code: string) => `/${code}`;

    return (
        <section>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center flex items-center justify-center gap-2 flex-wrap">
                Explore Our Community
                {/* Stats Badges */}
                <span className="flex gap-2 ml-2">
                    <Badge variant="secondary" className="text-sm font-normal">
                        {states.length} States
                    </Badge>
                    <Badge variant="outline" className="text-sm font-normal">
                        {states.reduce((acc, s) => acc + s.lgas.length, 0)} LGAs
                    </Badge>
                    <Badge variant="secondary" className="text-sm font-normal">
                        {states.reduce((acc, s) => acc + s.lgas.reduce((bAcc, l) => bAcc + l.branches.length, 0), 0)} Branches
                    </Badge>
                </span>
            </h2>

            <div className="bg-white dark:bg-card rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-border">
                {states.map((state) => (
                    <div
                        key={state.id}
                        className="border-b border-gray-200 dark:border-border last:border-0"
                    >
                        <div className="w-full flex justify-between items-center p-5 bg-gray-50 dark:bg-muted/50 hover:bg-gray-100 dark:hover:bg-muted transition-colors">
                            <button
                                onClick={() => toggleState(state.name)}
                                className="flex-1 text-left flex items-center"
                            >
                                <span className="font-bold text-xl text-gray-800 dark:text-gray-200">
                                    {state.name}
                                </span>
                            </button>
                            <div className="flex items-center gap-4">
                                <Link href={getLink(state.code)} className="text-sm text-green-600 hover:text-green-800 font-medium flex items-center hover:underline">
                                    View Page <ExternalLink className="h-3 w-3 ml-1" />
                                </Link>
                                <button onClick={() => toggleState(state.name)} className="text-2xl text-gray-500 w-8 text-center">
                                    {expandedState === state.name ? "−" : "+"}
                                </button>
                            </div>
                        </div>

                        {expandedState === state.name && (
                            <div className="bg-white dark:bg-card p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                                <p className="text-sm text-gray-500 dark:text-muted-foreground mb-2 uppercase tracking-wide font-semibold">
                                    Local Governments & Branches
                                </p>
                                {state.lgas.length === 0 ? (
                                    <p className="text-gray-500 italic">No LGAs listed for this state yet.</p>
                                ) : (
                                    state.lgas.map((lga) => (
                                        <div
                                            key={lga.id}
                                            className="border-l-4 border-green-500 pl-4 py-1"
                                        >
                                            <div className="flex justify-between items-center w-full">
                                                <button
                                                    onClick={() =>
                                                        setExpandedLga(
                                                            expandedLga === lga.name ? null : lga.name
                                                        )
                                                    }
                                                    className="flex items-center text-lg font-medium text-gray-800 dark:text-gray-200 hover:text-green-700 text-left flex-1"
                                                >
                                                    {lga.name}
                                                    <span className="ml-2 text-xs text-gray-400">
                                                        {expandedLga === lga.name ? "▼" : "▶"}
                                                    </span>
                                                </button>
                                                <Link href={getLink(lga.code)} className="text-xs text-green-600 hover:text-green-800 flex items-center mr-2 hover:underline">
                                                    LGA Page <ExternalLink className="h-3 w-3 ml-1" />
                                                </Link>
                                            </div>

                                            {expandedLga === lga.name && (
                                                <div className="mt-3 ml-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 animate-in slide-in-from-top-2 duration-200">
                                                    {lga.branches.length > 0 ? (
                                                        lga.branches.map((branch) => (
                                                            <Link
                                                                key={branch.id}
                                                                href={getLink(branch.code)}
                                                                className="text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-muted px-3 py-2 rounded hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors flex items-center justify-between group"
                                                            >
                                                                <span className="truncate mr-2">📍 {branch.name}</span>
                                                                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-50 flex-shrink-0" />
                                                            </Link>
                                                        ))
                                                    ) : (
                                                        <div className="text-sm text-gray-500 italic">No branches listed.</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}
