/**
 * Utility functions for normalizing and matching sponsor codes.
 * Kept outside "use server" so they can be used synchronously on both client and server.
 */

export function normalizeSponsorCode(raw: string): string {
    if (!raw) return "";
    let cleaned = String(raw).trim();

    // 1. Remove zero-width characters, non-breaking spaces, BOM
    cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF\u00A0]/g, "");

    // 2. Strip wrapping quotes, backticks, brackets, parentheses
    cleaned = cleaned.replace(/^["'“‘`\[\(]+|["'”’`\]\)]+$/g, "");

    // 3. Convert unicode dashes/hyphens/underscores to '-'
    cleaned = cleaned.replace(/[\u2010-\u2015\u2212\uFE63\uFF0D_]/g, "-");

    // 4. If a full URL was pasted (e.g. ?code=SP-1234ABCD)
    if (cleaned.toUpperCase().includes("CODE=")) {
        const parts = cleaned.split(/code=/i);
        if (parts[1]) {
            cleaned = parts[1].split("&")[0] || cleaned;
        }
    }

    // 5. Strip "Code:", "SP:", "SP-", "SP "
    cleaned = cleaned.replace(/^CODE\s*[:-]?\s*/i, "");
    cleaned = cleaned.replace(/\s+/g, "").toUpperCase();

    let core = cleaned;
    if (core.startsWith("SP-")) {
        core = core.substring(3);
    } else if (core.startsWith("SP")) {
        core = core.substring(2);
    }
    core = core.replace(/^-+/, "");

    // 6. Common visual/OCR confusion: O (letter) -> 0 (zero), I/L (letter) -> 1 (one)
    const hexSubstituted = core.replace(/O/g, "0").replace(/[IL]/g, "1").replace(/[^0-9A-F]/g, "");
    if (/^[0-9A-F]{8}$/.test(hexSubstituted)) {
        return `SP-${hexSubstituted}`;
    }

    const rawHex = core.replace(/[^0-9A-F]/g, "");
    if (/^[0-9A-F]{8}$/.test(rawHex)) {
        return `SP-${rawHex}`;
    }

    if (/^[0-9A-Z]{8}$/.test(core)) {
        return `SP-${core}`;
    }

    return cleaned;
}

export function extractSponsorCodeCandidates(raw: string): string[] {
    const candidates = new Set<string>();
    const trimmed = String(raw || "").trim();
    if (!trimmed) return [];

    const norm = normalizeSponsorCode(trimmed);
    if (norm) {
        candidates.add(norm);
        if (norm.startsWith("SP-")) {
            candidates.add(norm.substring(3));
        }
    }

    const upperTrimmed = trimmed.toUpperCase().replace(/\s+/g, "");
    candidates.add(upperTrimmed);
    candidates.add(upperTrimmed.replace(/[\u2010-\u2015\u2212\uFE63\uFF0D_]/g, "-"));

    // Extract any 8-char hex sequence
    const cleanWithSub = upperTrimmed.replace(/O/g, "0").replace(/[IL]/g, "1");
    const hex8Matches = cleanWithSub.match(/[0-9A-F]{8}/g);
    if (hex8Matches) {
        for (const h of hex8Matches) {
            candidates.add(`SP-${h}`);
            candidates.add(h);
        }
    }

    return Array.from(candidates).filter(Boolean);
}
