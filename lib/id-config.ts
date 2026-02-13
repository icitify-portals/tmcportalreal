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
    return COUNTRY_CODES[countryName] || "99"; // 99 as fallback/unknown
}

export function getStateCode(stateName: string): string {
    // Handle "Abuja" or "FCT"
    if (stateName.toLowerCase().includes("abuja") || stateName.toLowerCase().includes("fct")) {
        return "09";
    }

    // Try direct match
    const code = STATE_CODES[stateName];
    if (code) return code;

    // Try simpler match (ignore case)
    const normalized = Object.keys(STATE_CODES).find(k => k.toLowerCase() === stateName.toLowerCase());
    return normalized ? STATE_CODES[normalized] : "99"; // 99 for unknown
}
