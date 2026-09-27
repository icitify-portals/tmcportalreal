"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2 } from "lucide-react"

export interface EarlyBirdTierDraft {
    label: string
    startAt: string
    endAt: string
    amount: string
}

const emptyTier = (): EarlyBirdTierDraft => ({ label: "", startAt: "", endAt: "", amount: "" })

/**
 * Phased early bird windows editor (label + start/end dates + amount per window).
 * Controlled: parent owns the array via value/onChange.
 * When at least one valid window exists, it takes precedence over the single
 * early bird amount/deadline at payment time.
 */
export function EarlyBirdTiersField({
    value,
    onChange,
}: {
    value: EarlyBirdTierDraft[]
    onChange: (v: EarlyBirdTierDraft[]) => void
}) {
    const tiers = value || []

    const update = (index: number, patch: Partial<EarlyBirdTierDraft>) => {
        onChange(tiers.map((t, i) => (i === index ? { ...t, ...patch } : t)))
    }

    return (
        <div className="space-y-2 rounded-md border p-3 bg-muted/30">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-semibold">Early Bird Windows (phased)</p>
                    <p className="text-[11px] text-muted-foreground">
                        Optional. Each window has its own dates + price (e.g. First EB 20–25 Sep ₦17,000). Active windows override the single early bird above.
                    </p>
                </div>
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onChange([...tiers, { ...emptyTier(), label: tiers.length === 0 ? "First early bird" : tiers.length === 1 ? "Second early bird" : `Early bird ${tiers.length + 1}` }])}
                >
                    <Plus className="mr-1 h-3 w-3" /> Add window
                </Button>
            </div>

            {tiers.length === 0 && (
                <p className="text-xs text-muted-foreground">No phased windows — the single early bird (if set) applies.</p>
            )}

            {tiers.map((t, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end rounded-md border bg-white p-2">
                    <div className="col-span-12 md:col-span-3">
                        <label className="text-[10px] font-bold uppercase text-gray-500">Label</label>
                        <Input
                            placeholder={i === 0 ? "First early bird" : "Second early bird"}
                            value={t.label}
                            onChange={(e) => update(i, { label: e.target.value })}
                        />
                    </div>
                    <div className="col-span-6 md:col-span-3">
                        <label className="text-[10px] font-bold uppercase text-gray-500">Start</label>
                        <Input type="date" value={t.startAt} onChange={(e) => update(i, { startAt: e.target.value })} />
                    </div>
                    <div className="col-span-6 md:col-span-3">
                        <label className="text-[10px] font-bold uppercase text-gray-500">End</label>
                        <Input type="date" value={t.endAt} onChange={(e) => update(i, { endAt: e.target.value })} />
                    </div>
                    <div className="col-span-10 md:col-span-2">
                        <label className="text-[10px] font-bold uppercase text-gray-500">Amount ₦</label>
                        <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="17000"
                            value={t.amount}
                            onChange={(e) => update(i, { amount: e.target.value })}
                        />
                    </div>
                    <div className="col-span-2 md:col-span-1 flex justify-end">
                        <Button type="button" size="icon" variant="ghost" onClick={() => onChange(tiers.filter((_, j) => j !== i))} title="Remove window">
                            <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    )
}
