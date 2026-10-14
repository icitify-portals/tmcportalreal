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

// Corporate / chapter / organization block registrations are never auto-assigned
// to an individual — they are selected manually via the corporate picker.
export const isCorporateLabel = (label: string): boolean => norm(label).includes("corporate")

// The "non member" tier is reserved for guests and must never match a member.
export const isNonMemberLabel = (label: string): boolean => norm(label).startsWith("non")

export function getCorporateTiers(pricingTiers: unknown): { label: string; amount: number }[] {
    return Object.entries(flattenPricingTiers(pricingTiers))
        .filter(([label]) => isCorporateLabel(label))
        .map(([label, amount]) => ({ label, amount }))
}

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
    LOCAL_GOVERNMENT: ["lga", "local government", "local", "government"],
    BRANCH: ["branch"],
}

// Ordered preference when falling back to a general individual membership tier.
const MEMBER_KEYWORDS = ["ordinary", "general member", "delegate", "general", "member"]

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

    if (input.signedIn) {
        // Individual tiers only — corporate blocks and the guest "non member" tier are excluded.
        const eligible = tierEntries.filter(([label]) => !isCorporateLabel(label) && !isNonMemberLabel(label))

        const level = (input.officialLevel || "").toUpperCase()
        if (level && OFFICIAL_KEYWORDS[level]) {
            const match = eligible.find(([label]) => containsAny(norm(label), OFFICIAL_KEYWORDS[level]))
            if (match) return { kind: "member-tier", baseAmount: match[1], tierLabel: match[0] }
        }

        if (input.hasActiveMemberRecord || level) {
            const memberTier = MEMBER_KEYWORDS
                .map((kw) => eligible.find(([label]) => norm(label).includes(kw)))
                .find((m) => m) as [string, number] | undefined
            if (memberTier) return { kind: "member-tier", baseAmount: memberTier[1], tierLabel: memberTier[0] }
        }

        return { kind: "member-standard", baseAmount: standard, tierLabel: null }
    }

    const nonMember = tierEntries.find(([label]) => isNonMemberLabel(label) && !isCorporateLabel(label))
    if (nonMember) return { kind: "guest", baseAmount: nonMember[1], tierLabel: nonMember[0] }
    return { kind: "guest", baseAmount: standard, tierLabel: null }
}