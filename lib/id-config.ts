// Code mappings for ID generation
// Format: TMC/CC/SS/####

export const COUNTRY_CODES: Record<string, string> = {
    "Nigeria": "01",
    "Benin": "02",
};

export const STATE_CODES: Record<string, string> = {
    "Lagos": "01",
    "Ogun": "02",
    "Oyo": "03",
    "Osun": "04",
    "Kwara": "05",
    "Edo": "06",
    "Ondo": "07",
    "Ekiti": "08",
    "Abuja": "09",
    // "Kwara": "10", // Duplicate handled by ignoring or specialized logic if clarified. 
    // Assuming 10 is reserved or potentially another state like Kogi.
    // For now, mapping knowns.
};

export function getCountryCode(countryName: string): string {
    if (!countryName) return "99";
    const clean = countryName.trim().toLowerCase();
    
    // Direct or case-insensitive match
    const normalized = Object.keys(COUNTRY_CODES).find(k => k.toLowerCase() === clean);
    return normalized ? COUNTRY_CODES[normalized] : "99";
}

export function getStateCode(stateName: string): string {
    if (!stateName) return "99";
    const clean = stateName.trim().toLowerCase();

    // Handle "Abuja" or "FCT"
    if (clean.includes("abuja") || clean.includes("fct")) {
        return "09";
    }

    // Try robust match (ignore case, handle words like "State", e.g. "Lagos State" -> "Lagos")
    const normalized = Object.keys(STATE_CODES).find(k => {
        const stateKey = k.toLowerCase();
        return clean === stateKey || clean === `${stateKey} state` || clean.includes(stateKey);
    });
    
    return normalized ? STATE_CODES[normalized] : "99"; // 99 for unknown
}
