export function isNaipaMatcher(text?: string | null): boolean {
    if (!text) return false;
    const upper = text.toUpperCase();
    return (
        upper.includes("NAIPA") ||
        upper.includes("INFORMATION AND PUBLICATION") ||
        upper.includes("PUBLICITY")
    );
}

/**
 * Synchronous check on client/session object to see if user is authorized to manage News & Posts
 * (Super Admin, National Admin, Content Manager, or National NAIPA Officer).
 */
export function canManagePostsFromSession(user?: any): boolean {
    if (!user) return false;

    if (
        user.isSuperAdmin ||
        user.roles?.some((r: any) =>
            ["SUPER_ADMIN", "NATIONAL_ADMIN", "CONTENT_MANAGER"].includes(r.code) ||
            ["SYSTEM", "NATIONAL"].includes(r.jurisdictionLevel)
        )
    ) {
        return true;
    }

    if (
        user.officialLevel === "NATIONAL" &&
        (isNaipaMatcher(user.officialOfficeName) || isNaipaMatcher(user.officialPosition))
    ) {
        return true;
    }

    return false;
}
