import crypto from "crypto"

/**
 * Generates a dynamic token for attendance that changes every minute.
 * Uses HMAC-SHA256 of programmeId + secret + 1-minute time block.
 */
export function generateAttendanceToken(programmeId: string) {
    const secret = process.env.ATTENDANCE_SECRET || "tmc-dynamic-attendance-2026"
    // Use 1-minute intervals (60,000ms)
    const timeBlock = Math.floor(Date.now() / 60000)
    
    return crypto.createHmac("sha256", secret)
        .update(`${programmeId}-${timeBlock}`)
        .digest("hex")
        .substring(0, 16)
        .toUpperCase()
}

/**
 * Verifies a token. Also checks the previous minute to account for 
 * network latency or users who scanned just before a refresh.
 */
export function verifyAttendanceToken(programmeId: string, token: string) {
    const secret = process.env.ATTENDANCE_SECRET || "tmc-dynamic-attendance-2026"
    const currentTimeBlock = Math.floor(Date.now() / 60000)
    
    // Check current and previous time blocks (2-minute window)
    const validBlocks = [currentTimeBlock, currentTimeBlock - 1]
    
    for (const block of validBlocks) {
        const expected = crypto.createHmac("sha256", secret)
            .update(`${programmeId}-${block}`)
            .digest("hex")
            .substring(0, 16)
            .toUpperCase()
        
        if (token === expected) return true
    }
    
    return false
}
