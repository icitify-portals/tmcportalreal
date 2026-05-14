import { cookies } from "next/headers"

export async function getMockJurisdiction() {
    const cookieStore = await cookies()
    const level = cookieStore.get("tmc_mock_level")?.value
    const state = cookieStore.get("tmc_mock_state")?.value
    const lga = cookieStore.get("tmc_mock_lga")?.value
    const branch = cookieStore.get("tmc_mock_branch")?.value

    if (!level) return null

    return {
        level,
        state,
        lga,
        branch
    }
}
