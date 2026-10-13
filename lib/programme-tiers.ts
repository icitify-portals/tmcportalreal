export function flattenPricingTiers(pricingTiers: unknown): Record<string, number> {
    if (!pricingTiers) return {}
    let parsed: unknown = pricingTiers
    if (typeof pricingTiers === "string") {
        try {
            parsed = JSON.parse(pricingTiers)
        } catch {
            return {}
        }
    }
    if (!parsed || typeof parsed !== "object") return {}

    const out: Record<string, number> = {}
    for (const [key, value] of Object.entries(parsed)) {
        if (key === "individuals" || key === "corporate") {
            if (value && typeof value === "object") {
                for (const [label, amount] of Object.entries(value as Record<string, unknown>)) {
                    const n = Number(amount)
                    if (n > 0) out[label] = n
                }
            }
        } else {
            const n = Number(value)
            if (n > 0) out[key] = n
        }
    }
    return out
}

const norm = (label: string): string =>
    label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()

export interface EntitlementInput {
    pricingTiers: unknown
    amount: number | string | null
    earlyBirdAmount?: number | string | null
    earlyBirdDeadline?: Date | string | null
    signedIn: boolean
    officialLevel?: string | null
    hasActiveMemberRecord?: boolean
}

export interface Entitlement {
    kind: "member-tier" | "member-standard" | "guest"
    baseAmount: number
    tierLabel: string | null
}

const OFFICIAL_KEYWORDS: Record<string, string[]> = {
    NATIONAL: ["national", "nec"],
    STATE: ["state"],
    LOCAL_GOVERNMENT: ["lga", "local", "government"],
    BRANCH: ["branch"],
}

const containsAny = (candidate: string, words: string[]) =>
    words.some((w) => candidate.includes(w))

export function resolveEntitlement(input: EntitlementInput): Entitlement {
    const tiers = flattenPricingTiers(input.pricingTiers)
    const tierEntries = Object.entries(tiers)

    const amount = Number(input.amount ?? 0)
    const isEarlyBird =
        !!input.earlyBirdAmount &&
        !!input.earlyBirdDeadline &&
        new Date() <= new Date(input.earlyBirdDeadline)
    const earlyBirdAmount = Number(input.earlyBirdAmount ?? 0)
    const standard = isEarlyBird && earlyBirdAmount > 0 ? earlyBirdAmount : amount

    const pickLabel = (predicate: (n: string) => boolean): string | null => {
        const match = tierEntries.find(([label]) => predicate(norm(label)))
        return match ? match[0] : null
    }

    if (input.signedIn) {
        const level = (input.officialLevel || "").toUpperCase()
        if (level && OFFICIAL_KEYWORDS[level]) {
            const label = pickLabel((n) => containsAny(n, OFFICIAL_KEYWORDS[level]))
            if (label) return { kind: "member-tier", baseAmount: tiers[label], tierLabel: label }
        }
        if (input.hasActiveMemberRecord) {
            const label = pickLabel((n) => n.includes("ordinary"))
            if (label) return { kind: "member-tier", baseAmount: tiers[label], tierLabel: label }
        }
        return { kind: "member-standard", baseAmount: standard, tierLabel: null }
    }

    const nonMember = tierEntries.find(([label]) => {
        const n = norm(label)
        return n.includes("non member") || n.startsWith("non")
    })
    if (nonMember) return { kind: "guest", baseAmount: nonMember[1], tierLabel: nonMember[0] }
    return { kind: "guest", baseAmount: standard, tierLabel: null }
}