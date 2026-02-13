"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { v4 as uuidv4 } from "uuid"

const VISITOR_ID_KEY = "tmc_visitor_id"
const SESSION_ID_KEY = "tmc_session_id"
const SESSION_LAST_ACTIVE = "tmc_session_last_active"
const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 mins

export function SiteVisitor() {
    const pathname = usePathname()

    useEffect(() => {
        // Skip tracking for common ignore paths or API routes
        if (
            pathname.startsWith("/api") ||
            pathname.startsWith("/_next") ||
            pathname.includes("/static") ||
            pathname.includes("/favicon.ico")
        ) {
            return
        }

        const now = Date.now()
        let visitorId = localStorage.getItem(VISITOR_ID_KEY)
        let sessionId = sessionStorage.getItem(SESSION_ID_KEY)
        const lastActive = parseInt(localStorage.getItem(SESSION_LAST_ACTIVE) || "0")

        // 1. Ensure Visitor ID exists
        if (!visitorId) {
            visitorId = uuidv4()
            localStorage.setItem(VISITOR_ID_KEY, visitorId)
        }

        // 2. Manage Session ID (30 min timeout)
        const isNewSession = !sessionId || (now - lastActive > SESSION_TIMEOUT)

        if (isNewSession) {
            sessionId = uuidv4()
            sessionStorage.setItem(SESSION_ID_KEY, sessionId)
        }

        localStorage.setItem(SESSION_LAST_ACTIVE, now.toString())

        const recordVisit = async () => {
            try {
                await fetch("/api/analytics/visit", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        visitorId,
                        sessionId,
                        path: pathname,
                    }),
                })
            } catch (err) {
                // Silently fail to not disrupt user experience
                console.warn("Analytics tracking skipped")
            }
        }

        // Short delay to ensure it doesn't block critical page load
        const timer = setTimeout(recordVisit, 1000)
        return () => clearTimeout(timer)
    }, [pathname])

    return null
}
